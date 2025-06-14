import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir); // ✅ Success case
    } catch (err) {
      cb(err as Error, uploadDir); // ✅ Error case
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for testing
    cb(null, true);
  }
});

// Interface for grammar checking
interface GrammarError {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
  rule: string;
  severity: 'error' | 'warning' | 'info';
}

interface GrammarResponse {
  errors: GrammarError[];
  correctedText?: string;
  statistics: {
    totalErrors: number;
    wordCount: number;
    characterCount: number;
  };
}

// Advanced Grammar Checking Service
class GrammarChecker {
  private rules = [
    {
      name: 'your_youre',
      pattern: /\b(your|you're)\b/gi,
      check: (match: RegExpMatchArray, context: string) => {
        const word = match[0].toLowerCase();
        const afterWord = context.slice(match.index! + match[0].length, match.index! + match[0].length + 50);
        
        if (word === 'your' && /^\s+(are|going|being|doing|looking|coming|saying)\b/i.test(afterWord)) {
          return {
            message: "Did you mean 'you're' (you are)?",
            replacements: ["you're"],
            severity: 'error' as const
          };
        }
        
        if (word === "you're" && /^\s+(cat|dog|house|book|idea|friend|family|work|job|car|phone)\b/i.test(afterWord)) {
          return {
            message: "Did you mean 'your' (possessive)?",
            replacements: ["your"],
            severity: 'error' as const
          };
        }
        
        return null;
      }
    },
    {
      name: 'there_their_theyre',
      pattern: /\b(there|their|they're)\b/gi,
      check: (match: RegExpMatchArray, context: string) => {
        const word = match[0].toLowerCase();
        const afterWord = context.slice(match.index! + match[0].length, match.index! + match[0].length + 50);
        const beforeWord = context.slice(Math.max(0, match.index! - 20), match.index!);
        
        if (word === 'there' && /^\s+(cat|dog|house|book|car|phone|family|friend)\b/i.test(afterWord)) {
          return {
            message: "Did you mean 'their' (possessive)?",
            replacements: ["their"],
            severity: 'error' as const
          };
        }
        
        if (word === 'their' && /^\s+(are|going|being|doing)\b/i.test(afterWord)) {
          return {
            message: "Did you mean 'they're' (they are)?",
            replacements: ["they're"],
            severity: 'error' as const
          };
        }
        
        return null;
      }
    },
    {
      name: 'its_its',
      pattern: /\b(its|it's)\b/gi,
      check: (match: RegExpMatchArray, context: string) => {
        const word = match[0].toLowerCase();
        const afterWord = context.slice(match.index! + match[0].length, match.index! + match[0].length + 50);
        
        if (word === 'its' && /^\s+(been|going|time|important|necessary|obvious)\b/i.test(afterWord)) {
          return {
            message: "Did you mean 'it's' (it is/it has)?",
            replacements: ["it's"],
            severity: 'error' as const
          };
        }
        
        if (word === "it's" && /^\s+(color|size|shape|beauty|importance|value)\b/i.test(afterWord)) {
          return {
            message: "Did you mean 'its' (possessive)?",
            replacements: ["its"],
            severity: 'warning' as const
          };
        }
        
        return null;
      }
    },
    {
      name: 'multiple_spaces',
      pattern: /\s{2,}/g,
      check: (match: RegExpMatchArray) => ({
        message: "Multiple consecutive spaces found",
        replacements: [" "],
        severity: 'info' as const
      })
    },
    {
      name: 'sentence_capitalization',
      pattern: /[.!?]\s+[a-z]/g,
      check: (match: RegExpMatchArray) => ({
        message: "Sentence should start with a capital letter",
        replacements: [match[0].slice(0, -1) + match[0].slice(-1).toUpperCase()],
        severity: 'error' as const
      })
    },
    {
      name: 'double_punctuation',
      pattern: /[.!?]{2,}/g,
      check: (match: RegExpMatchArray) => ({
        message: "Multiple punctuation marks found",
        replacements: [match[0][0]],
        severity: 'warning' as const
      })
    },
    {
      name: 'common_typos',
      pattern: /\b(teh|adn|nad|thier|recieve|seperate|occured|begining|goverment|enviroment)\b/gi,
      check: (match: RegExpMatchArray) => {
        const corrections: { [key: string]: string } = {
          'teh': 'the',
          'adn': 'and',
          'nad': 'and',
          'thier': 'their',
          'recieve': 'receive',
          'seperate': 'separate',
          'occured': 'occurred',
          'begining': 'beginning',
          'goverment': 'government',
          'enviroment': 'environment'
        };
        
        return {
          message: `Possible typo: "${match[0]}"`,
          replacements: [corrections[match[0].toLowerCase()]],
          severity: 'error' as const
        };
      }
    }
  ];

  checkText(text: string): GrammarResponse {
    const errors: GrammarError[] = [];
    let correctedText = text;

    // Apply grammar rules
    for (const rule of this.rules) {
      let match;
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
      
      while ((match = pattern.exec(text)) !== null) {
        const suggestion = rule.check(match, text);
        if (suggestion) {
          errors.push({
            message: suggestion.message,
            offset: match.index!,
            length: match[0].length,
            replacements: suggestion.replacements,
            rule: rule.name,
            severity: suggestion.severity
          });
        }
      }
    }

    // Generate corrected text
    if (errors.length > 0) {
      // Sort errors by offset in descending order to avoid offset shifting
      const sortedErrors = errors
        .filter(e => e.replacements.length > 0)
        .sort((a, b) => b.offset - a.offset);
      
      for (const error of sortedErrors) {
        correctedText = 
          correctedText.slice(0, error.offset) +
          error.replacements[0] +
          correctedText.slice(error.offset + error.length);
      }
    }

    // Calculate statistics
    const wordCount = text.trim().split(/\s+/).length;
    const characterCount = text.length;

    return {
      errors: errors.sort((a, b) => a.offset - b.offset),
      correctedText: correctedText !== text ? correctedText : undefined,
      statistics: {
        totalErrors: errors.length,
        wordCount,
        characterCount
      }
    };
  }
}

const grammarChecker = new GrammarChecker();

// Routes

// Health check (no auth needed)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0-no-auth'
  });
});

// File upload endpoint (no auth needed)
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = await Promise.all(files.map(async (file) => {
      const stats = await fs.stat(file.path);
      
      return {
        id: path.parse(file.filename).name.split('-')[0],
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: stats.birthtime,
        path: file.path
      };
    }));

    res.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      files: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Grammar check endpoint
app.post('/api/grammar-check', async (req, res) => {
  try {
    const { text, fileId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = grammarChecker.checkText(text);
    
    // If fileId provided, save results to file
    if (fileId) {
      const resultsPath = `uploads/grammar-${fileId}.json`;
      await fs.writeFile(resultsPath, JSON.stringify(result, null, 2));
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Grammar check error:', error);
    res.status(500).json({ 
      error: 'Grammar check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get file content for grammar checking
app.get('/api/file/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const uploadsDir = 'uploads';
    
    // Find file by ID prefix
    const files = await fs.readdir(uploadsDir);
    const targetFile = files.find(file => file.startsWith(id));
    
    if (!targetFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, targetFile);
    const stats = await fs.stat(filePath);
    
    // Only read text files
    if (stats.size > 1024 * 1024) { // 1MB limit
      return res.status(400).json({ error: 'File too large for content reading' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    
    res.json({
      success: true,
      content,
      filename: targetFile,
      size: stats.size
    });
  } catch (error) {
    console.error('File read error:', error);
    res.status(500).json({ 
      error: 'Failed to read file content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List uploaded files
app.get('/api/files', async (req, res) => {
  try {
    const uploadsDir = 'uploads';
    
    try {
      await fs.access(uploadsDir);
    } catch {
      return res.json({ success: true, files: [] });
    }

    const files = await fs.readdir(uploadsDir);
    const fileInfos = await Promise.all(
      files
        .filter(file => !file.startsWith('grammar-')) // Exclude grammar result files
        .map(async (filename) => {
          const filePath = path.join(uploadsDir, filename);
          const stats = await fs.stat(filePath);
          const id = filename.split('-')[0];
          const originalName = filename.substring(filename.indexOf('-') + 1);
          
          return {
            id,
            filename,
            originalName,
            size: stats.size,
            uploadedAt: stats.birthtime,
            isTextFile: /\.(txt|md|json|js|ts|html|css|py|java|cpp|c|h)$/i.test(filename)
          };
        })
    );

    res.json({
      success: true,
      files: fileInfos.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    });
  } catch (error) {
    console.error('File listing error:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete file
app.delete('/api/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const uploadsDir = 'uploads';
    
    const files = await fs.readdir(uploadsDir);
    const targetFile = files.find(file => file.startsWith(id));
    
    if (!targetFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    await fs.unlink(path.join(uploadsDir, targetFile));
    
    // Also delete grammar results if they exist
    const grammarFile = `grammar-${id}.json`;
    try {
      await fs.unlink(path.join(uploadsDir, grammarFile));
    } catch {
      // Grammar file might not exist, ignore error
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files per request.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dockitty Backend running on port ${PORT}`);
  console.log(`📁 Upload directory: uploads/`);
  console.log(`🔓 Authentication: DISABLED`);
  console.log(`✅ Grammar checking: ENABLED`);
});

export default app;