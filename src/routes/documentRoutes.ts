import express from 'express';
import multer from 'multer';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { openai } from '../utils/openai';
import { handleDocumentUpload } from '../controllers/docController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('document'), handleDocumentUpload);
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const buffer = fs.readFileSync(file.path);
    let textContent = '';

    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      textContent = data.text;
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      textContent = result.value;
    } else if (file.mimetype === 'text/plain') {
      textContent = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ message: 'Unsupported file type.' });
    }

    // Correct text using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a professional writing assistant.' },
        { role: 'user', content: `Please correct this text:\n\n${textContent}` },
      ],
    });

    const correctedText = completion.choices[0].message.content;
    res.json({ correctedText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing file.' });
  } finally {
    fs.unlinkSync(file.path); // Delete uploaded file after processing
  }
});

export default router;
