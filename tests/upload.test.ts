import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import app from '../server';

describe('Dockitty Upload & Grammar API Tests', () => {
  const testFilesDir = 'test-files';
  const uploadsDir = 'uploads';
  
  beforeAll(async () => {
    // Create test files directory
    await fs.mkdir(testFilesDir, { recursive: true });
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Create test files
    const testFiles = {
      'simple.txt': 'Hello world! This is a test file.',
      'grammar-errors.txt': 'Your going to love this file. There cat is very cute. Its been a long day and teh weather is nice.',
      'large.txt': 'A'.repeat(5000), // Large text file
      'empty.txt': '',
      'mixed-content.md': `# Test Document
      
Your going to see some grammar errors here.
- Its a beautiful day
- There going to the store
- I recieve your message

## Code Block
\`\`\`javascript
console.log("Hello world");
\`\`\`

This document has seperate sections with occured mistakes.`,
      'json-data.json': JSON.stringify({ 
        message: "Your going to love this JSON",
        data: { items: ["Its working", "There ready"] }
      }),
      'binary-data.png': Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) // PNG header
    };
    
    for (const [filename, content] of Object.entries(testFiles)) {
      await fs.writeFile(path.join(testFilesDir, filename), content);
    }
  });
  
  afterAll(async () => {
    // Cleanup test files
    try {
      await fs.rm(testFilesDir, { recursive: true, force: true });
      await fs.rm(uploadsDir, { recursive: true, force: true });
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });
  
  beforeEach(async () => {
    // Clear uploads directory before each test
    try {
      const files = await fs.readdir(uploadsDir);
      await Promise.all(files.map(file => fs.unlink(path.join(uploadsDir, file))));
    } catch (error) {
      // Directory might not exist or be empty
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toMatchObject({
        status: 'healthy',
        version: '2.0.0-no-auth'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('File Upload', () => {
    it('should upload a single text file successfully', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('files', path.join(testFilesDir, 'simple.txt'))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0]).toMatchObject({
        originalName: 'simple.txt',
        mimetype: 'text/plain'
      });
    });

    it('should upload multiple files simultaneously', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('files', path.join(testFilesDir, 'simple.txt'))
        .attach('files', path.join(testFilesDir, 'json-data.json'))
        .attach('files', path.join(testFilesDir, 'mixed-content.md'))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(3);
      
      const fileNames = response.body.files.map((f: any) => f.originalName);
      expect(fileNames).toContain('simple.txt');
      expect(fileNames).toContain('json-data.json');
      expect(fileNames).toContain('mixed-content.md');
    });

    it('should handle binary files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('files', path.join(testFilesDir, 'binary-data.png'))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.files[0].originalName).toBe('binary-data.png');
    });

    it('should handle empty files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('files', path.join(testFilesDir, 'empty.txt'))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.files[0].size).toBe(0);
    });

    it('should reject requests with no files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .expect(400);
      
      expect(response.body.error).toBe('No files uploaded');
    });

    it('should handle large files within limit', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('files', path.join(testFilesDir, 'large.txt'))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.files[0].size).toBe(5000);
    });
  });

  describe('Grammar Checking', () => {
    it('should detect your/you\'re errors', async () => {
      const text = "Your going to love this. Your cat is cute and you're house is nice.";
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.errors).toHaveLength(2);
      
      const errors = response.body.errors;
      expect(errors[0].message).toContain("you're");
      expect(errors[1].message).toContain("your");
    });

    it('should detect there/their/they\'re errors', async () => {
      const text = "There cat is cute. Their going to the store. They're house is big.";
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);
      
      const errorMessages = response.body.errors.map((e: any) => e.message);
      expect(errorMessages.some((msg: string) => msg.includes('their'))).toBe(true);
    });

    it('should detect common typos', async () => {
      const text = "Teh weather is nice and I recieve your message about seperate issues.";
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.errors.length).toBe(3);
      
      const replacements = response.body.errors.flatMap((e: any) => e.replacements);
      expect(replacements).toContain('the');
      expect(replacements).toContain('receive');
      expect(replacements).toContain('separate');
    });

    it('should detect multiple spaces', async () => {
      const text = "This  has   multiple    spaces.";
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.errors.length).toBe(3);
      expect(response.body.errors.every((e: any) => e.message.includes('Multiple'))).toBe(true);
    });

    it('should detect capitalization errors', async () => {
      const text = "This is a sentence. this should be capitalized.";
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.errors.length).toBe(1);
      expect(response.body.errors[0].message).toContain('capital');
    });

    it('should provide corrected text', async () => {
      const text = "Your going to love this  file.";
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.correctedText).toBeDefined();
      expect(response.body.correctedText).toBe("You're going to love this file.");
    });

    it('should provide statistics', async () => {
      const text = "This is a test sentence with multiple words.";
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toMatchObject({
        wordCount: 8,
        characterCount: 44,
        totalErrors: 0
      });
    });

    it('should handle empty text', async () => {
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text: '' })
        .expect(400);
      
      expect(response.body.error).toBe('Text is required');
    });

    it('should save results when fileId provided', async () => {
      const text = "Your going to test this feature.";
      const fileId = 'test-123';
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text, fileId })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Check if results file was created
      const resultsPath = path.join(uploadsDir, `grammar-${fileId}.json`);
      const exists = await fs.access(resultsPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('File Management', () => {
    let uploadedFileId: string;
    
    beforeEach(async () => {
      // Upload a test file for management tests
      const response = await request(app)
        .post('/api/upload')
        .attach('files', path.join(testFilesDir, 'simple.txt'));
      
      uploadedFileId = response.body.files[0].id;
    });

    it('should list uploaded files', async () => {
      const response = await request(app)
        .get('/api/files')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0]).toMatchObject({
        id: uploadedFileId,
        originalName: 'simple.txt',
        isTextFile: true
      });
    });

    it('should get file content', async () => {
      const response = await request(app)
        .get(`/api/file/${uploadedFileId}/content`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.content).toBe('Hello world! This is a test file.');
    });

    it('should delete uploaded file', async () => {
      const response = await request(app)
        .delete(`/api/file/${uploadedFileId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('File deleted successfully');
      
      // Verify file is deleted
      const listResponse = await request(app)
        .get('/api/files')
        .expect(200);
      
      expect(listResponse.body.files).toHaveLength(0);
    });

    it('should handle file not found', async () => {
      const response = await request(app)
        .get('/api/file/nonexistent/content')
        .expect(404);
      
      expect(response.body.error).toBe('File not found');
    });
  });

  describe('Integration Tests', () => {
    it('should upload file and perform grammar check', async () => {
      // Upload file with grammar errors
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('files', path.join(testFilesDir, 'grammar-errors.txt'))
        .expect(200);
      
      const fileId = uploadResponse.body.files[0].id;
      
      // Get file content
      const contentResponse = await request(app)
        .get(`/api/file/${fileId}/content`)
        .expect(200);
      
      // Check grammar
      const grammarResponse = await request(app)
        .post('/api/grammar-check')
        .send({ 
          text: contentResponse.body.content,
          fileId 
        })
        .expect(200);
      
      expect(grammarResponse.body.success).toBe(true);
      expect(grammarResponse.body.errors.length).toBeGreaterThan(0);
      expect(grammarResponse.body.correctedText).toBeDefined();
      
      // Verify grammar results were saved
      const resultsPath = path.join(uploadsDir, `grammar-${fileId}.json`);
      const exists = await fs.access(resultsPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should handle complex markdown file', async () => {
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('files', path.join(testFilesDir, 'mixed-content.md'))
        .expect(200);
      
      const fileId = uploadResponse.body.files[0].id;
      
      const contentResponse = await request(app)
        .get(`/api/file/${fileId}/content`)
        .expect(200);
      
      const grammarResponse = await request(app)
        .post('/api/grammar-check')
        .send({ text: contentResponse.body.content })
        .expect(200);
      
      expect(grammarResponse.body.success).toBe(true);
      expect(grammarResponse.body.errors.length).toBeGreaterThan(0);
      
      // Should detect multiple types of errors
      const errorTypes = new Set(grammarResponse.body.errors.map((e: any) => e.rule));
      expect(errorTypes.size).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ invalidField: 'test' })
        .expect(400);
      
      expect(response.body.error).toBe('Text is required');
    });

    it('should handle 404 routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body.error).toBe('Endpoint not found');
    });

    it('should handle large text gracefully', async () => {
      const largeText = 'A'.repeat(100000); // 100KB text
      
      const response = await request(app)
        .post('/api/grammar-check')
        .send({ text: largeText })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.statistics.characterCount).toBe(100000);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent uploads', async () => {
      const uploadPromises = Array(5).fill(0).map(() =>
        request(app)
          .post('/api/upload')
          .attach('files', path.join(testFilesDir, 'simple.txt'))
      );
      
      const responses = await Promise.all(uploadPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      // Verify all files were uploaded
      const listResponse = await request(app)
        .get('/api/files')
        .expect(200);
      
      expect(listResponse.body.files).toHaveLength(5);
    });

    it('should handle concurrent grammar checks', async () => {
      const texts = [
        "Your going to love this test.",
        "There cat is very cute today.",
        "Its been a long day at work.",
        "I recieve your message clearly.",
        "The seperate issues are resolved."
      ];
      
      const grammarPromises = texts.map(text =>
        request(app)
          .post('/api/grammar-check')
          .send({ text })
      );
      
      const responses = await Promise.all(grammarPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.errors.length).toBeGreaterThan(0);
      });
    });
  });
});