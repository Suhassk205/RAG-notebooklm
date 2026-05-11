const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: 'Hello world',
      config: {
        outputDimensionality: 768
      }
    });
    console.log('gemini-embedding-2 (config.768) Success:', response.embeddings[0].values.length);
  } catch (e) {
    console.error('gemini-embedding-2 (config.768) Error:', e.message);
  }
}

test();
