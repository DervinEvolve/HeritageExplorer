import { z } from "zod";
import { searchTavily } from "./tavily";
import { marked } from "marked";

const documentSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["manuscript", "letter", "artifact", "record"]),
  imageUrl: z.string()
});

const documentsResponseSchema = z.object({
  documents: z.array(documentSchema)
});

interface PerplexityResponse {
  content: string;
  contentHtml: string;
  citations?: string[];
  documents?: Array<{
    id: string;
    title: string;
    imageUrl: string;
    description: string;
    type: "manuscript" | "letter" | "artifact" | "record";
  }>;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function extractJsonFromText(text: string): { content: string; jsonStr: string } {
  const defaultResponse = {
    content: text.trim(),
    jsonStr: '{"documents":[]}'
  };

  try {
    const jsonStart = text.lastIndexOf('{"documents":');
    if (jsonStart === -1) return defaultResponse;

    let braceCount = 1;
    let jsonEnd = jsonStart + 1;
    let inString = false;
    let escapeNext = false;

    while (jsonEnd < text.length && braceCount > 0) {
      const char = text[jsonEnd];

      if (escapeNext) {
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"' && !escapeNext) {
        inString = !inString;
      } else if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }

      jsonEnd++;
    }

    const jsonStr = text.slice(jsonStart, jsonEnd);
    const content = text.slice(0, jsonStart).trim();

    // Test parse the JSON
    JSON.parse(jsonStr);

    return { content, jsonStr };
  } catch (e) {
    console.warn('JSON parsing error:', e);
    return defaultResponse;
  }
}

async function enrichDocumentsWithTavilyImages(documents: PerplexityResponse['documents'], query: string) {
  if (!documents?.length) return documents;

  try {
    const searchQuery = `${query} historical artifacts images`;
    console.log('Searching Tavily for images:', searchQuery);

    const tavilyResults = await searchTavily(searchQuery);

    // Check if we have results
    if (!tavilyResults?.results?.length) {
      console.warn('No results from Tavily search');
      return useFallbackImages(documents);
    }

    // Extract all images from all results
    const images = tavilyResults.results
      .flatMap(result => result.images || [])
      .filter(image => image.url && image.url.startsWith('http'))
      .map(image => ({
        url: image.url,
        description: image.description
      }));

    if (!images.length) {
      console.warn('No valid images found in Tavily results');
      return useFallbackImages(documents);
    }

    // Map images to documents
    return documents.map((doc, index) => {
      const image = images[index % images.length];
      return {
        ...doc,
        imageUrl: image.url,
        imageDescription: image.description
      };
    });

  } catch (error) {
    console.error('Failed to enrich documents with images:', error);
    return useFallbackImages(documents);
  }
}

function useFallbackImages(documents: PerplexityResponse['documents']): PerplexityResponse['documents'] {
  if (!documents) return documents;
  console.log('Using fallback images for all documents');
  return documents.map(doc => useFallbackImage(doc));
}

function useFallbackImage(doc: NonNullable<PerplexityResponse['documents']>[number]) {
  console.log(`Using fallback image for document ${doc.id} of type ${doc.type}`);
  return {
    ...doc,
    imageUrl: `/placeholder-${doc.type}.jpg`
  };
}

async function processMarkdown(text: string): Promise<string> {
  return marked(text, { breaks: true });
}

export async function askPerplexity(question: string): Promise<PerplexityResponse> {
  if (!import.meta.env.VITE_PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key is not configured');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a knowledgeable cultural heritage research assistant. Structure your responses in two parts:

1. Main content: Provide clear, organized research information with section headers marked by ###.

2. Document list: End your response with exactly 2-3 relevant historical documents in this JSON format:

{"documents": [
  {
    "id": "doc-1",
    "title": "Document Title",
    "description": "Brief description",
    "type": "manuscript",
    "imageUrl": "https://example.com/placeholder.jpg"
  }
]}

Document requirements:
- Types allowed: manuscript, letter, artifact, record
- Ensure document titles and descriptions are historically accurate
- Place JSON at the very end of your response`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        top_p: 0.9,
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const { content: cleanContent, jsonStr } = extractJsonFromText(content);

    // Parse and validate documents
    let documents: PerplexityResponse['documents'] = [];
    let contentHtml = '';
    try {
      const parsedJson = JSON.parse(jsonStr);
      const validatedData = documentsResponseSchema.parse(parsedJson);
      documents = validatedData.documents.map(doc => ({
        ...doc,
        id: doc.id || generateId()
      }));

      // Process markdown in the content
      contentHtml = await processMarkdown(cleanContent);

      // Enrich documents with Tavily images
      documents = await enrichDocumentsWithTavilyImages(documents, question);
    } catch (error) {
      console.error('Document processing error:', error);
      documents = [];
    }

    return {
      content: cleanContent,
      contentHtml,
      citations: data.citations || [],
      documents
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to get response from research assistant');
  }
}