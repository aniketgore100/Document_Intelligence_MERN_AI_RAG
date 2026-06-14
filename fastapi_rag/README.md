FastAPI RAG microservice (initial scaffold)

Purpose
- Consume SQS messages pushed by MERN app
- Download documents from S3
- Notify MERN via secure webhook about processing status
- Provide API key auth for future endpoints

Run (development)
1. Create a virtualenv and install dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and set values

3. Run the app:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload
```

Notes
- The worker runs as a background thread inside FastAPI for this initial scaffold.
- SQS messages are deleted only after successful webhook confirmation.
- Modules for OCR, parsing, chunking, embeddings, Qdrant, retrieval, and LLM orchestration are placeholders for now.
