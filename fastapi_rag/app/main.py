import time
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from .config import settings
from .logging_config import logger
from .sqs_worker import SQSWorker
from .auth import require_api_key

app = FastAPI(title='RAG Worker')
worker = SQSWorker()


@app.on_event('startup')
async def start_worker():
    logger.info('Starting worker on startup')
    worker.start()


@app.on_event('shutdown')
async def stop_worker():
    logger.info('Stopping worker')
    worker.stop()


@app.get('/health')
async def health():
    return JSONResponse({'status': 'ok'})


@app.get('/protected', dependencies=[Depends(require_api_key)])
async def protected():
    return {'ok': True}
