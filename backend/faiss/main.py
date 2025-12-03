from fastapi import FastAPI
from pydantic import BaseModel
from fastembed.embedding import TextEmbedding
import numpy as np
import faiss
import os

app = FastAPI()

# Load FastEmbed model (small, fast, no GPU needed)
model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
DIM = model.embedding_size
 # auto = 384
INDEX_PATH = "index.bin"

# Load or create FAISS index
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

# Convert text → embedding
def get_embedding(text: str):
    emb = list(model.embed([text]))[0]   # FastEmbed returns a generator
    return np.array(emb, dtype="float32")

@app.post("/add")
def add_vector(data: AddRequest):
    vector = get_embedding(data.text)
    index.add(np.array([vector]))
    faiss.write_index(index, INDEX_PATH)
    return {"faissId": index.ntotal - 1}

@app.post("/search")
def search_vector(data: SearchRequest):
    q = get_embedding(data.query)
    D, I = index.search(np.array([q]), data.k)
    return {
        "results": [
            {"id": int(i), "score": float(d)}
            for i, d in zip(I[0], D[0])
        ]
    }
