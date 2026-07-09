from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from .rag_pipeline import answer_query
from .auth import require_api_key
from .logging_config import logger

router = APIRouter(prefix="/rag", tags=["rag"])


class QueryRequest(BaseModel):
    query: str
    document_id: str


class ChunkHighlight(BaseModel):
    text: str
    page_number: Optional[int] = None
    coordinates: Optional[Any] = None
    category: Optional[str] = None
    element_id: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    document_id: str
    chunks: list[ChunkHighlight]


@router.post("/query", response_model=QueryResponse, dependencies=[Depends(require_api_key)])
async def query_document(request: QueryRequest):
    """Query a previously ingested document using the RAG pipeline."""
    try:
        result = answer_query(request.query, collection_name=request.document_id)
        return QueryResponse(
            answer=result["answer"],
            document_id=request.document_id,
            chunks=result["chunks"],
        )
    except Exception as e:
        logger.exception("RAG query failed")
        raise HTTPException(status_code=500, detail=str(e))
