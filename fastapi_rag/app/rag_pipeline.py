import json
import numpy as np
from functools import lru_cache
from langchain_community.document_loaders import UnstructuredPDFLoader
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model
from .config import settings
from .logging_config import logger


SYSTEM_PROMPT = """You are an advanced, intelligent assistant specialized in answering questions accurately based on a combination of retrieved context and your own extensive knowledge base.

When answering the user's query:
1. Prioritize any relevant, factual information provided in the "Retrieved Context" block below.
2. If the retrieved context is brief, missing details, or highly specific, seamlessly blend in your own general knowledge to provide a comprehensive, clear, and well-rounded answer.
3. If the retrieved context is completely irrelevant to the user's true intent, rely entirely on your own accurate knowledge base to answer the question.
4. Maintain an objective, informative, and professional tone. Do not mention phrases like "According to the provided text" or "Based on the context" unless strictly necessary.

Format every response using valid GitHub Flavored Markdown:
- Use `#` for the main title.
- Use `##` for section headings.
- Use `###` for subsections when needed.
- Use numbered lists (`1.`, `2.`) for sequential or ordered items.
- Use bullet lists (`-`) for non-sequential items.
- Use **bold** only for emphasis, not as headings.
- Use tables where appropriate to compare or organize information.
- Use fenced code blocks (```) for code, commands, or JSON.
- Do not wrap the entire response in triple backticks.
- Produce clean, well-structured Markdown that renders correctly in GitHub, Notion, or any standard Markdown viewer.

Retrieved Context:
{context}
"""

_embedding_model: HuggingFaceEmbeddings | None = None


def get_embedding_model() -> HuggingFaceEmbeddings:
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading HuggingFace embedding model (all-MiniLM-L6-v2)")
        _embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embedding_model


def _sanitize_coordinates(coords):
    if isinstance(coords, dict):
        return {k: _sanitize_coordinates(v) for k, v in coords.items()}
    elif isinstance(coords, (list, tuple)):
        return [_sanitize_coordinates(v) for v in coords]
    elif isinstance(coords, (np.float64, np.float32)):
        return float(coords)
    return coords


def ingest_pdf(pdf_path: str, collection_name: str) -> int:
    """Load, chunk, embed and persist a PDF into a named Chroma collection.

    Returns the number of chunks stored.
    """
    logger.info(f"Ingesting PDF '{pdf_path}' into collection '{collection_name}'")

    loader = UnstructuredPDFLoader(
        file_path=pdf_path,
        strategy="hi_res",
        mode="elements",
    )
    chunks = loader.load()

    cleaned_documents = []
    for chunk in chunks:
        if not chunk.page_content.strip():
            continue
        metadata = chunk.metadata.copy()
        if "coordinates" in metadata:
            metadata["coordinates"] = json.dumps(_sanitize_coordinates(metadata["coordinates"]))
        cleaned_documents.append(Document(page_content=chunk.page_content, metadata=metadata))

    if not cleaned_documents:
        logger.warning("No content extracted from PDF")
        return 0

    Chroma.from_documents(
        documents=cleaned_documents,
        embedding=get_embedding_model(),
        persist_directory=settings.CHROMA_PERSIST_DIR,
        collection_name=collection_name,
        collection_metadata={"hnsw:space": "cosine"},
    )

    logger.info(f"Stored {len(cleaned_documents)} chunks in collection '{collection_name}'")
    return len(cleaned_documents)


def _get_vector_db(collection_name: str) -> Chroma:
    return Chroma(
        persist_directory=settings.CHROMA_PERSIST_DIR,
        embedding_function=get_embedding_model(),
        collection_name=collection_name,
    )


def retrieve_context(query: str, collection_name: str, k: int = 5) -> list[dict]:
    """Retrieve the most relevant chunks for a query from a named collection."""
    vector_db = _get_vector_db(collection_name)
    primary_matches = vector_db.similarity_search_with_relevance_scores(query, k=k)
    if not primary_matches:
        return []

    best_match = primary_matches[0][0]
    best_score = primary_matches[0][1]
    for doc, score in primary_matches:
        if doc.metadata.get("category") == "Title" and score > 0.3:
            best_match = doc
            best_score = score
            break

    best_metadata = best_match.metadata

    if best_metadata.get("category") == "Title":
        logger.info(f"Section root: '{best_match.page_content}'")

        all_page_elements = vector_db.get(
            where={
                "$and": [
                    {"source": best_metadata.get("source")},
                    {"page_number": best_metadata.get("page_number")},
                ]
            }
        )

        documents_on_page = [
            {
                "text": all_page_elements["documents"][i],
                "metadata": all_page_elements["metadatas"][i],
                "id": all_page_elements["ids"][i],
            }
            for i in range(len(all_page_elements["documents"]))
        ]

        start_idx = next(
            (
                idx
                for idx, doc in enumerate(documents_on_page)
                if doc["metadata"].get("element_id") == best_metadata.get("element_id")
            ),
            None,
        )

        if start_idx is not None:
            context_chunks = [{**documents_on_page[start_idx], "score": best_score}]
            target_parent_id = best_metadata.get("element_id")

            for next_doc in documents_on_page[start_idx + 1:]:
                next_meta = next_doc["metadata"]
                if next_meta.get("parent_id") == target_parent_id:
                    context_chunks.append(next_doc)
                    continue
                if next_meta.get("category") == "Title":
                    break
                context_chunks.append(next_doc)

            return context_chunks

    return [{"text": best_match.page_content, "metadata": best_metadata, "score": best_score}]


def _serialize_chunk(chunk: dict) -> dict:
    """Return only the fields useful for frontend highlighting."""
    metadata = chunk.get("metadata", {})
    coordinates = metadata.get("coordinates")
    if isinstance(coordinates, str):
        try:
            coordinates = json.loads(coordinates)
        except (ValueError, TypeError):
            coordinates = None

    raw_score = chunk.get("score")
    score_pct = round(raw_score * 100) if raw_score is not None else None

    return {
        "text": chunk.get("text", ""),
        "page_number": metadata.get("page_number"),
        "coordinates": coordinates,
        "category": metadata.get("category"),
        "element_id": metadata.get("element_id"),
        "score": score_pct,
    }


def answer_query(query: str, collection_name: str) -> dict:
    """Retrieve context and generate an answer using the Groq LLM.

    Returns a dict with 'answer' (str) and 'chunks' (list of highlight-ready dicts).
    """
    results = retrieve_context(query, collection_name)

    context_str = "\n\n".join(
        f"[Result {i+1}]: {chunk.get('text', '') if isinstance(chunk, dict) else str(chunk)}"
        for i, chunk in enumerate(results)
    )

    llm = init_chat_model("llama-3.3-70b-versatile", model_provider="groq")
    messages = [
        SystemMessage(content=SYSTEM_PROMPT.format(context=context_str)),
        HumanMessage(content=query),
    ]

    response = llm.invoke(messages)

    return {
        "answer": response.content,
        "chunks": [_serialize_chunk(c) for c in results if isinstance(c, dict)],
    }
