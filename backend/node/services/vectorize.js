// services/vectorize.js

const HF_TOKEN = process.env.HF_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_INDEX = process.env.CF_VECTOR_INDEX;

async function generateEmbedding(text) {
  // Use HuggingFace inference API to cleanly generate vector embeddings in Node
  const res = await fetch('https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${HF_TOKEN || ''}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ inputs: text })
  });
  
  if (!res.ok) throw new Error('Failed to generate embedding');
  const data = await res.json();
  const vector = Array.isArray(data[0]) ? data[0] : data;
  
  console.log(`[EMBEDDING GENERATED] Vector length: ${vector.length}`);
  return vector;
}

export async function addVector(text, metadata) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_INDEX) {
    throw new Error("Missing Cloudflare Vectorize config variables");
  }
  
  const values = await generateEmbedding(text);
  const vectorId = metadata.journalId.toString(); // Use exact journal.id as vector ID
  
  const payload = {
    vectors: [
      {
        id: vectorId,
        values,
        metadata
      }
    ]
  };
  
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/v2/indexes/${CF_INDEX}/upsert`;

  // Insert vector using Cloudflare Vectorize REST API (not bindings)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vectorize upsert failed: ${errorText}`);
  }
  
  console.log(`[VECTOR INSERTED] Vector ID: ${vectorId}`);
  return vectorId;
}

export async function searchVector(query, k = 5) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_INDEX) {
    throw new Error("Missing Cloudflare Vectorize config variables");
  }

  const values = await generateEmbedding(query);
  
  const payload = {
    vector: values,
    topK: k,
    returnMetadata: true
  };

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/v2/indexes/${CF_INDEX}/query`;
  
  // Query using Cloudflare Vectorize REST API
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vectorize query failed: ${errorText}`);
  }
  
  const data = await res.json();
  const matches = data.result?.matches || [];
  
  console.log(`[VECTOR SEARCH RESULTS] Match count: ${matches.length}`);
  return matches;
}
