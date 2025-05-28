import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const handleDocumentUpload = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Process file and call OpenAI here...
    return res.json({ correctedText: 'Corrected output from OpenAI' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Upload failed' });
  }
};
export const uploadDocument = async (req: Request, res: Response) => {
  const { userId, content } = req.body;

  try {
    const doc = await prisma.document.create({
      data: { userId, content }
    });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    const docs = await prisma.document.findMany({
      where: { userId: String(userId) }
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};
