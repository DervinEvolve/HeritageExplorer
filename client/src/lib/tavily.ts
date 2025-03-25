import { z } from "zod";

// Define schema for individual image result
const tavilyImageSchema = z.object({
  url: z.string().url(),
  description: z.string().optional()
});

// Define schema for search result
const tavilySearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  content: z.string().optional(),
  images: z.array(tavilyImageSchema).optional(),
  source_url: z.string().optional()
});

// Schema for the complete API response
const tavilyResponseSchema = z.object({
  results: z.array(tavilySearchResultSchema)
});

export interface TavilyImage {
  url: string;
  description?: string;
}

export interface TavilySearchResult {
  results: Array<{
    title: string;
    url: string;
    content?: string;
    images?: TavilyImage[];
    source_url?: string;
  }>;
}

export async function searchTavily(query: string): Promise<TavilySearchResult> {
  try {
    const response = await fetch('/api/tavily/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavily API error:', errorText);
      throw new Error(errorText);
    }

    const data = await response.json();
    const validated = tavilyResponseSchema.parse(data);
    return validated;
  } catch (error) {
    console.error('Tavily API error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to fetch images from Tavily API');
  }
}