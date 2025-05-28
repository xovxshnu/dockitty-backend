import express from 'express';
import { uploadDocument, getDocuments } from '../controllers/docController';

const router = express.Router();

router.post('/upload', uploadDocument);
router.get('/', getDocuments);

export default router;
