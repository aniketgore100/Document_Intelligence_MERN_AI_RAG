# Placeholders for extensible modules

# OCR
def ocr_process(path: str):
    raise NotImplementedError('OCR not implemented yet')

# Parsing
def parse_document(path: str):
    raise NotImplementedError('Parsing not implemented yet')

# Chunking
def chunk_text(text: str):
    raise NotImplementedError('Chunking not implemented yet')

# Embeddings
def embed_chunks(chunks):
    raise NotImplementedError('Embeddings not implemented yet')

# Qdrant
def qdrant_upsert(chunks, vectors):
    raise NotImplementedError('Qdrant integration not implemented yet')

# Retrieval
def retrieve(query: str):
    raise NotImplementedError('Retrieval not implemented yet')

# LLM orchestration
def run_llm(prompt: str):
    raise NotImplementedError('LLM orchestration not implemented yet')
