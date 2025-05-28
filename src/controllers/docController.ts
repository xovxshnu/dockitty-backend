import { Request, Response } from 'express';
import prisma from '../prisma/client';

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
