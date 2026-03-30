// services/vectorize.js

async function generateEmbedding(env, text) {
  // Use Cloudflare Workers AI if available
  if (env.AI) {
    const response = await env.AI.run('@cf/baai/bge-small-en-v1.5', { text: [text] });
    return response.data[0];
  }

  // Fallback to fetch (e.g., using Cloudflare REST API or another embedding model)
  const res = await fetch('https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${env.HF_TOKEN || process.env.HF_TOKEN || ''}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ inputs: text })
  });
  
  if (!res.ok) throw new Error('Failed to generate embedding');
  const data = await res.json();
  return Array.isArray(data[0]) ? data[0] : data;
}

export async function addVector(env, text, metadata) {
  if (!env.VECTORIZE && !process.env.VECTORIZE) {
    throw new Error("Vectorize binding not found");
  }
  
  const vectorizeBinding = env.VECTORIZE || process.env.VECTORIZE;
  const values = await generateEmbedding(env, text);
  
  // Create a unique vector ID (e.g. using journalId)
  const vectorId = metadata.journalId.toString();
  
  const vector = {
    id: vectorId,
    values,
    metadata
  };
  
  // Insert into Cloudflare Vectorize
  await vectorizeBinding.insert([vector]);
  
  return vectorId;
}

export async function searchVector(env, query, k = 5) {
  if (!env.VECTORIZE && !process.env.VECTORIZE) {
    throw new Error("Vectorize binding not found");
  }

  const vectorizeBinding = env.VECTORIZE || process.env.VECTORIZE;
  const values = await generateEmbedding(env, query);
  
  // Query Cloudflare Vectorize
  const result = await vectorizeBinding.query(values, { 
    topK: k,
    returnMetadata: true 
  });
  
  return result.matches || [];
}
