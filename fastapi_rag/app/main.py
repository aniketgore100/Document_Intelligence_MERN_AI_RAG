import time
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .logging_config import logger
from .sqs_worker import SQSWorker
from .auth import require_api_key
from .rag_router import router as rag_router

app = FastAPI(title='RAG Worker')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "x-api-key"],
)

app.include_router(rag_router)
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
