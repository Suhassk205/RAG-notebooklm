import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { getPineconeIndex } from '@/lib/pinecone';
import { splitText } from '@/lib/text-splitter';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    let textData = formData.get('text') as string | null;

    if (!file && !textData) {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
    }

    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const PDFParser = require('pdf2json');
        const pdfParser = new PDFParser(null, 1);
        textData = await new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
            resolve(pdfParser.getRawTextContent());
          });
          pdfParser.parseBuffer(Buffer.from(buffer));
        });
      } else {
        textData = await file.text();
      }
    }

    if (!textData) {
      return NextResponse.json({ error: 'Could not extract text' }, { status: 400 });
    }

    const chunks = splitText(textData);
    const index = getPineconeIndex();
    const vectors = [];
    const ai = getGeminiClient();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: chunk,
        config: { outputDimensionality: 768 }
      });

      if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
        vectors.push({
          id: crypto.randomUUID(),
          values: response.embeddings[0].values,
          metadata: {
            text: chunk,
            filename: file ? file.name : 'pasted_text',
            createdAt: new Date().toISOString()
          }
        });
      }
    }

    if (vectors.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert({ records: batch });
      }
    }

    return NextResponse.json({ success: true, message: `Successfully embedded and indexed ${chunks.length} chunks.` });
  } catch (error: any) {
    console.error('Error during ingestion:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
