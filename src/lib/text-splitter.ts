export function splitText(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] {
  if (chunkSize <= chunkOverlap) {
    throw new Error('chunkSize must be greater than chunkOverlap');
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + chunkSize, text.length);

    if (endIndex < text.length) {
      // Try to find a good breaking point (newline or period)
      let breakPoint = text.lastIndexOf('\n', endIndex);
      if (breakPoint <= startIndex) {
        breakPoint = text.lastIndexOf('. ', endIndex);
      }
      
      if (breakPoint > startIndex) {
        endIndex = breakPoint + 1; // Include the newline or period
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    // Advance start index, overlapping by chunkOverlap
    // Ensure we actually advance to avoid infinite loops if overlap is misconfigured or text is weird
    const nextStart = endIndex - chunkOverlap;
    if (nextStart <= startIndex) {
        startIndex = endIndex;
    } else {
        startIndex = nextStart;
    }
  }

  return chunks;
}
