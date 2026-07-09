import os
import pathlib
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

_BASE_DIR = pathlib.Path(__file__).parent.parent  # fastapi_rag/

class Settings:
    AWS_REGION: Optional[str] = os.getenv('AWS_REGION')
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_SQS_QUEUE_URL: Optional[str] = os.getenv('AWS_SQS_QUEUE_URL')
    AWS_S3_BUCKET: Optional[str] = os.getenv('AWS_S3_BUCKET')

    MERN_WEBHOOK_URL: Optional[str] = os.getenv('MERN_WEBHOOK_URL')
    MERN_WEBHOOK_API_KEY: Optional[str] = os.getenv('MERN_WEBHOOK_API_KEY')

    GROQ_API_KEY: Optional[str] = os.getenv('GROQ_API_KEY')
    CHROMA_PERSIST_DIR: str = os.getenv('CHROMA_PERSIST_DIR', str(_BASE_DIR / 'chroma_db'))
    CORS_ORIGINS: list = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')

    API_KEY: Optional[str] = os.getenv('API_KEY', 'change-me')
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')

settings = Settings()
