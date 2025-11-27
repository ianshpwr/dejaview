import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import json
#return indexes

# 1. Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# 2. Load FAISS index
index = faiss.read_index("index.bin")

# 3. Load metadata (text of all notes)
with open("metadata.json", "r") as f:
    metadata = json.load(f)  # list of strings


def search_faiss(query, top_k=5):
    # Convert query → embedding
    vector = model.encode([query])
    vector = np.array(vector).astype("float32")

    # Search FAISS
    distances, indices = index.search(vector, top_k)

    results = []
    for i, d in zip(indices[0], distances[0]):
        results.append({
            "text": metadata[i],
            "score": float(d)
        })
    
    return results
