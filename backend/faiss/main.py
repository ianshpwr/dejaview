from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import os

app = FastAPI()

DIM = 384
INDEX_PATH = "index.bin"
model = SentenceTransformer("all-MiniLM-L6-v2")

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
    return {"faissId": index.ntotal - 1}

@app.post("/search")
def search_vector(data: SearchRequest):
    q = model.encode(data.query).astype("float32")
    D, I = index.search(np.array([q]), data.k)
    return {
        "results": [
            {"id": int(i), "score": float(d)}
            for i, d in zip(I[0], D[0])
        ]
    }
