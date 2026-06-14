import boto3
from botocore.exceptions import BotoCoreError, ClientError
from .config import settings
from .logging_config import logger

s3_client = None

def get_s3_client():
    global s3_client
    if s3_client:
        return s3_client
    session = boto3.session.Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    s3_client = session.client('s3')
    return s3_client


def get_object_stream(bucket: str, key: str):
    """Stream S3 object directly without storing to disk."""
    client = get_s3_client()
    try:
        response = client.get_object(Bucket=bucket, Key=key)
        file_size = response.get('ContentLength', 0)
        logger.info(f"Streaming S3://{bucket}/{key} (size: {file_size} bytes)")
        return response['Body']
    except (BotoCoreError, ClientError) as e:
        logger.exception("Failed to get S3 object stream")
        raise

