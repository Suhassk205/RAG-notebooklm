import { Pinecone } from '@pinecone-database/pinecone';

let pinecone: Pinecone | null = null;

export const getPineconeClient = () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || 'dummy_key',
    });
  }
  return pinecone;
};

export const getPineconeIndex = () => {
  const client = getPineconeClient();
  return client.Index(process.env.PINECONE_INDEX || 'dummy_index');
};
