import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const FAISS_URL = process.env.FAISS_URL;

export async function addToFaiss(text) {
  const res = await axios.post(`${FAISS_URL}/add`, { text });
  return res.data.faissId;
}

export async function searchFaiss(query, k = 5) {
  const res = await axios.post(`${FAISS_URL}/search`, { query, k });
  return res.data.results;
}
