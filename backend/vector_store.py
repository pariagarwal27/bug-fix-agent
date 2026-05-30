import os
import cohere
import faiss
import numpy as np
from typing import List, Dict

co = cohere.Client(os.getenv("COHERE_API_KEY"))

def embed_texts(texts: List[str]) -> np.ndarray:
    """Convert list of texts to embeddings using Cohere"""
    response = co.embed(
        texts=texts,
        model="embed-english-v3.0",
        input_type="search_document"
    )
    return np.array(response.embeddings, dtype="float32")

def embed_query(query: str) -> np.ndarray:
    """Embed a search query"""
    response = co.embed(
        texts=[query],
        model="embed-english-v3.0",
        input_type="search_query"
    )
    return np.array(response.embeddings, dtype="float32")

def build_vector_store(chunks: List[Dict]):
    """Build FAISS index from code chunks"""
    texts = [f"File: {c['path']}\n\n{c['content']}" for c in chunks]

    # Embed all chunks
    embeddings = embed_texts(texts)

    # Build FAISS index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    return index, chunks, texts

def search_relevant_chunks(index, chunks: List[Dict], bug_description: str, top_k: int = 5) -> List[Dict]:
    """Find most relevant code chunks for a bug description"""
    query_embedding = embed_query(bug_description)

    distances, indices = index.search(query_embedding, top_k)

    results = []
    for i, idx in enumerate(indices[0]):
        if idx < len(chunks):
            chunk = chunks[idx].copy()
            chunk["relevance_score"] = float(distances[0][i])
            results.append(chunk)

    return results