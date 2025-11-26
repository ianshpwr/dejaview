import axios from "axios";

const FAISS_URL = "http://127.0.0.1:8001";

export async function addToFaiss(text) {
  const res = await axios.post(`${FAISS_URL}/add`, { text });
  return res.data.faissId;
}

export async function searchFaiss(query, k = 5) {
  const res = await axios.post(`${FAISS_URL}/search`, { query, k });
  return res.data.results;
}
