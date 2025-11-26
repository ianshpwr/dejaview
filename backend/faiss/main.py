from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import os

app = FastAPI()

DIM = 384   # embedding dimension for all-MiniLM-L6-v2
INDEX_PATH = "index.bin"

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Create/load FAISS index
if os.path.exists(INDEX_PATH):
    index = faiss.read_index(INDEX_PATH)
else:
    index = faiss.IndexFlatL2(DIM)
    faiss.write_index(index, INDEX_PATH)

class AddRequest(BaseModel):
    text: str

class SearchRequest(BaseModel):
    query: str
    k: int = 5

@app.post("/add")
def add_vector(data: AddRequest):
    vector = model.encode(data.text).astype("float32")
    index.add(np.array([vector]))
    faiss.write_index(index, INDEX_PATH)

    # Save metadata
    import json
    if os.path.exists("metadata.json"):
        with open("metadata.json", "r") as f:
            metadata = json.load(f)
    else:
        metadata = []

    metadata.append(data.text)

    with open("metadata.json", "w") as f:
        json.dump(metadata, f)

    return {"faissId": index.ntotal - 1}
@app.post("/search")
def search_vector(data: SearchRequest):
    q = model.encode(data.query).astype("float32")
    D, I = index.search(np.array([q]), data.k)

    import json
    with open("metadata.json", "r") as f:
        metadata = json.load(f)

    results = []
    for idx, dist in zip(I[0], D[0]):
        if idx == -1:
            continue
        
        # FIX 1: ensure metadata exists for this index
        if idx >= len(metadata):
            continue  # skip missing entries
        
        results.append({
            "id": int(idx),
            "text": metadata[idx],
            "score": float(dist)
        })

    return {"results": results}
