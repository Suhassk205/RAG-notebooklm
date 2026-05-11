import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { getPineconeIndex } from '@/lib/pinecone';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
        return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }
    
    const userPrompt = latestMessage.content;
    const ai = getGeminiClient();

    const embedResponse = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: userPrompt,
      config: { outputDimensionality: 768 }
    });

    const queryVector = embedResponse.embeddings?.[0]?.values;

    if (!queryVector) {
      return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
    }

    const index = getPineconeIndex();
    const queryResult = await index.query({
      vector: queryVector,
      topK: 5,
      includeMetadata: true,
    });

    const contextText = queryResult.matches
      .map(match => match.metadata?.text)
      .filter(text => text)
      .join('\n\n---\n\n');

    const systemInstruction = `You are a helpful AI assistant. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Keep the answer concise and relevant.

Context:
${contextText}`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-flash-latest',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          if (chunk.text) {
             const encoded = new TextEncoder().encode(chunk.text);
             controller.enqueue(encoded);
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
        }
    });

  } catch (error: any) {
    console.error('Error during chat:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
