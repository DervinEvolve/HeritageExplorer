import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Tavily search with images endpoint
  app.post('/api/tavily/images', async (req, res) => {
    try {
      const apiKey = process.env.TAVILY_API_KEY?.trim();

      if (!apiKey) {
        return res.status(500).json({ 
          error: 'Tavily API configuration error',
          details: 'Missing API key'
        });
      }

      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          error: 'Invalid request',
          details: 'Query parameter must be a non-empty string'
        });
      }

      // Make request to Tavily API using correct endpoint
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          query: query.trim(),
          include_images: true,
          include_answer: false,
          search_depth: "advanced",
          max_results: 10
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Tavily API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        return res.status(response.status).json({ 
          error: 'Tavily API request failed',
          details: errorText
        });
      }

      const data = await response.json();
      res.json(data);

    } catch (error) {
      console.error('Tavily search error:', error);
      res.status(500).json({ 
        error: 'Failed to search images',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}