import faiss
import numpy as np
from functools import lru_cache
from sentence_transformers import SentenceTransformer
import json


# -----------------------
# 1. Load model ONLY once (cached)
# -----------------------
@lru_cache()
def get_model():
    return SentenceTransformer("all-MiniLM-L6-v2")

# -----------------------
# 2. Load index ONLY once (convert to float16 → 50% RAM reduction)
# -----------------------
@lru_cache()
def get_index():
    index = faiss.read_index("index.bin")

    # Convert index to float16 (HALVES memory instantly)
    faiss.cast_index_to_float16(index)
    return index


# -----------------------
# 3. Load metadata once
# -----------------------
@lru_cache()
def get_metadata():
    with open("metadata.json", "r") as f:
        return json.load(f)


# -----------------------
# 4. Search function
# -----------------------
def search_faiss(query, top_k=5):

    model = get_model()
    index = get_index()
    metadata = get_metadata()

    # Embed → convert to float16 to match index
    vector = model.encode([query])
    vector = np.array(vector).astype("float16")

    # Search
    distances, indices = index.search(vector.astype('float32'), top_k)

    results = []
    for i, d in zip(indices[0], distances[0]):
        results.append({
            "text": metadata[i],
            "score": float(d)
        })

    return results
