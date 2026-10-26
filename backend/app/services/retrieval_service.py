"""Retrieval service: simple keyword/TF-IDF style search over document chunks.

This is a lightweight, dependency-free retrieval implementation suitable for
small corpora. For production-grade semantic search, swap in a vector store
(e.g. pgvector, Qdrant) and an embedding model behind the same interface.
"""
import math
import re
from collections import Counter

from app.extensions import db
from app.models import DocumentChunk


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _tf(tokens: list[str]) -> Counter:
    return Counter(tokens)


def _idf(docs_tokens: list[list[str]]) -> dict[str, float]:
    n = len(docs_tokens)
    df: Counter = Counter()
    for tokens in docs_tokens:
        for term in set(tokens):
            df[term] += 1
    return {term: math.log((n + 1) / (freq + 1)) + 1 for term, freq in df.items()}


def search_chunks(query: str, document_ids: list[str] | None = None, top_k: int = 5) -> list[dict]:
    """Rank chunks by TF-IDF cosine similarity against the query."""
    q_tokens = _tokenize(query)
    if not q_tokens:
        return []

    db_query = DocumentChunk.query
    if document_ids:
        db_query = db_query.filter(DocumentChunk.document_id.in_(document_ids))
    chunks = db_query.all()
    if not chunks:
        return []

    docs_tokens = [_tokenize(c.content) for c in chunks]
    idf = _idf(docs_tokens)
    q_tf = _tf(q_tokens)

    scored = []
    for chunk, tokens in zip(chunks, docs_tokens):
        if not tokens:
            continue
        d_tf = _tf(tokens)
        # Cosine similarity between query and document TF-IDF vectors.
        dot = sum(q_tf[t] * idf.get(t, 0) * d_tf[t] * idf.get(t, 0) for t in q_tf if t in d_tf)
        q_norm = math.sqrt(sum((q_tf[t] * idf.get(t, 0)) ** 2 for t in q_tf)) or 1e-9
        d_norm = math.sqrt(sum((d_tf[t] * idf.get(t, 0)) ** 2 for t in d_tf)) or 1e-9
        score = dot / (q_norm * d_norm)
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [
        {
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "score": round(score, 4),
        }
        for score, chunk in scored[:top_k]
    ]


def build_context(query: str, document_ids: list[str] | None = None, top_k: int = 4) -> str:
    """Return a single context string assembled from top chunks."""
    results = search_chunks(query, document_ids, top_k)
    if not results:
        return ""
    parts = []
    for i, r in enumerate(results, 1):
        parts.append(f"[{i}] {r['content']}")
    return "\n\n".join(parts)
