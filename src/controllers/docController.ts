import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { Configuration, OpenAIApi } from 'openai';

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

export const handleDocumentUpload = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const content = file.buffer.toString('utf-8'); // Only handles .txt, not .pdf or .docx

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a grammar correction assistant.',
        },
        {
          role: 'user',
          content: `Correct the grammar of the following text:\n${content}`,
        },
      ],
    });

    const correctedText = completion.data.choices[0].message?.content || '';

    const doc = await prisma.document.create({
      data: {
        userId: req.body.userId,
        content: correctedText,
      },
    });

    res.json({ correctedText, document: doc });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ message: 'Grammar correction failed' });
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
