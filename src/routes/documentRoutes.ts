import express from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { verifyToken } from '../middleware/verifyToken';
import { correctTextWithAI } from '../services/grammarCorrector';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/documents',
  verifyToken,
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const file = req.file;
      if (!file) return res.status(400).json({ message: 'No file uploaded' });

      const originalText = file.buffer.toString('utf-8');
      const correctedText = await correctTextWithAI(originalText);

      const doc = await prisma.document.create({
        data: {
          content: correctedText,
          userId: userId,
        },
      });

      res.json({ correctedText: doc.content });
    } catch (err) {
      console.error('Document upload failed:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
);

router.get('/documents', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (err) {
    console.error('Fetch documents failed:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
