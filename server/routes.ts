import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'avatar-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
      // Accept images only
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        // @ts-ignore - multer types expect the first parameter to be null for success
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Get current user profile
  app.get('/api/user/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user profile',
        details: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  });

  // Update user profile
  app.put('/api/user/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const { name, email, interests } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Update user
      const updatedUser = await db.update(users)
        .set({ 
          name, 
          email,
          interests: interests || [] 
        })
        .where(eq(users.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ 
        error: 'Failed to update user profile',
        details: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  });

  // Upload profile avatar
  app.post('/api/user/:userId/avatar', upload.single('avatar'), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Generate the URL for the uploaded file
      const avatarUrl = `/uploads/${file.filename}`;

      // Update user with new avatar URL
      const updatedUser = await db.update(users)
        .set({ avatarUrl })
        .where(eq(users.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        success: true, 
        avatarUrl, 
        user: updatedUser[0] 
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ 
        error: 'Failed to upload avatar',
        details: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
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