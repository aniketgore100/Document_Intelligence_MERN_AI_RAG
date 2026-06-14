from loguru import logger
from .config import settings

logger.remove()
logger.add(lambda msg: print(msg, end=''), level=settings.LOG_LEVEL)
