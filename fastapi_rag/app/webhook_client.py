import requests
from .config import settings
from .logging_config import logger


def build_webhook_url(document_id: str) -> str:
    url = settings.MERN_WEBHOOK_URL
    if not url:
        raise RuntimeError('MERN_WEBHOOK_URL is not configured')
    return url.replace('{documentId}', str(document_id))


def send_processing_update(document_id: str, job_id: str, status: str, error: str = None) -> None:
    url = build_webhook_url(document_id)
    headers = {
        'Content-Type': 'application/json',
    }
    if settings.MERN_WEBHOOK_API_KEY:
        headers['x-api-key'] = settings.MERN_WEBHOOK_API_KEY

    payload = {
        'jobId': job_id,
        'documentId': document_id,
        'processingStatus': status,
    }
    if error:
        payload['processingError'] = error

    logger.info(f'Sending webhook to {url} payload={payload}')
    resp = requests.post(url, json=payload, headers=headers, timeout=15)
    if resp.status_code >= 400:
        logger.error(f'Webhook responded with {resp.status_code}: {resp.text}')
        resp.raise_for_status()
    logger.info('Webhook update acknowledged')
