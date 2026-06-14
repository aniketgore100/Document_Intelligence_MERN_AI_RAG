import time
import json
import threading
import traceback
from typing import Dict
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from .config import settings
from .s3_client import get_object_stream
from .webhook_client import send_processing_update
from .logging_config import logger


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

        # logger.info(f'Polling SQS: {self.queue_url}')
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
                    logger.info(f'Received SQS message: {msg.get("MessageId")}')
                    try:
                        payload = json.loads(body)
                        self.process_message(payload)
                        # Delete only after success
                        self.sqs.delete_message(QueueUrl=self.queue_url, ReceiptHandle=receipt)
                        logger.info('Deleted message from queue')
                    except Exception as e:
                        logger.exception('Processing message failed, leaving in queue for retry')
                        # don't delete message so it can be retried
                        continue
            except (BotoCoreError, ClientError) as e:
                logger.exception('SQS receive failed, retrying in 5s')
                time.sleep(5)
            except Exception as e:
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

        logger.info(f'Processing job {job_id} doc {document_id}')

        # Update MERN: QUEUED -> already set by MERN, but we can POST status
        try:
            send_processing_update(document_id, job_id, 'PROCESSING')
        except Exception:
            logger.exception('Failed to notify MERN of PROCESSING status')

        # Stream and process file on the fly
        try:
            file_stream = get_object_stream(settings.AWS_S3_BUCKET, s3_key)
            # TODO: call OCR/parsing/chunking/embeddings modules with file_stream
            logger.info(f'Processing file stream from S3')
            # after successful processing
            send_processing_update(document_id, job_id, 'COMPLETED')
        except Exception as e:
            logger.exception('Processing failed')
            try:
                send_processing_update(document_id, job_id, 'FAILED', error=str(e))
            except Exception:
                logger.exception('Failed to notify MERN of FAILED status')
            return
