import os
import time
import json
import tempfile
import threading
import traceback
from typing import Dict
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from .config import settings
from .s3_client import get_object_stream
from .webhook_client import send_processing_update
from .logging_config import logger
from .rag_pipeline import ingest_pdf


class SQSWorker:
    def __init__(self):
        self.queue_url = settings.AWS_SQS_QUEUE_URL
        self._stop = threading.Event()
        self.sqs = boto3.client('sqs',
                               aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                               aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                               region_name=settings.AWS_REGION)

    def start(self):
        thread = threading.Thread(target=self.run, daemon=True)
        thread.start()
        logger.info('SQS worker thread started')

    def stop(self):
        self._stop.set()

    def run(self):
        if not self.queue_url:
            logger.error('AWS_SQS_QUEUE_URL not configured; SQS worker will not run')
            return

        while not self._stop.is_set():
            try:
                resp = self.sqs.receive_message(
                    QueueUrl=self.queue_url,
                    MaxNumberOfMessages=5,
                    WaitTimeSeconds=10,
                    VisibilityTimeout=300,
                )
                messages = resp.get('Messages', [])
                if not messages:
                    continue

                for msg in messages:
                    receipt = msg.get('ReceiptHandle')
                    body = msg.get('Body')
                    msg_id = msg.get("MessageId", "")
                    _sep = "─" * 54
                    logger.opt(colors=True).info(f"<dim>{_sep}</dim>")
                    logger.opt(colors=True).info(f"<green>  ◉  SQS MSG  {msg_id[:20]}…</green>")
                    logger.opt(colors=True).info(f"<dim>{_sep}</dim>")
                    try:
                        payload = json.loads(body)
                        self.process_message(payload)
                        # Delete only after success
                        self.sqs.delete_message(QueueUrl=self.queue_url, ReceiptHandle=receipt)
                        logger.opt(colors=True).info(f"<green>  ✔  Message deleted from queue</green>")
                        logger.opt(colors=True).info(f"<dim>{_sep}</dim>")
                    except Exception:
                        logger.exception('Processing message failed, leaving in queue for retry')
                        logger.opt(colors=True).warning(f"<yellow>  ✖  Left in queue for retry</yellow>")
                        logger.opt(colors=True).info(f"<dim>{_sep}</dim>")
                        # don't delete message so it can be retried
                        continue
            except (BotoCoreError, ClientError):
                logger.exception('SQS receive failed, retrying in 5s')
                time.sleep(5)
            except Exception:
                logger.exception('Unexpected worker error')
                time.sleep(5)

    def process_message(self, payload: Dict):
        # expected payload: { jobId, documentId, organizationId, s3Key }
        job_id = payload.get('jobId')
        document_id = payload.get('documentId')
        org_id = payload.get('organizationId')
        s3_key = payload.get('s3Key')

        if not (job_id and document_id and s3_key):
            logger.error('Invalid message payload; missing jobId/documentId/s3Key')
            return

        logger.opt(colors=True).info(
            f"<cyan>  ▶  JOB</cyan>  <white>{job_id[:16]}…</white>"
            f"  <dim>doc:</dim> <white>{document_id[:16]}…</white>"
        )

        # Update MERN: QUEUED -> already set by MERN, but we can POST status
        try:
            send_processing_update(document_id, job_id, 'PROCESSING')
        except Exception:
            logger.exception('Failed to notify MERN of PROCESSING status')

        # Stream PDF from S3 into a temp file, then run the RAG ingestion pipeline
        try:
            file_stream = get_object_stream(settings.AWS_S3_BUCKET, s3_key)
            logger.info('Streaming file from S3 for ingestion')

            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                tmp_path = tmp.name
                tmp.write(file_stream.read())

            try:
                chunk_count = ingest_pdf(tmp_path, collection_name=document_id)
                logger.info(f'Ingested {chunk_count} chunks for document {document_id}')
            finally:
                os.unlink(tmp_path)

            send_processing_update(document_id, job_id, 'COMPLETED')
        except Exception as e:
            logger.exception('Processing failed')
            try:
                send_processing_update(document_id, job_id, 'FAILED', error=str(e))
            except Exception:
                logger.exception('Failed to notify MERN of FAILED status')
            return
