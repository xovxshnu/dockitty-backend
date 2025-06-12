import express from 'express';
import cors from 'cors';
// import authRoutes from './routes/authRoutes'; // ✅ Import here
import docRoutes from './routes/docRoutes';
import documentRoutes from './routes/documentRoutes';
import googleAuthRoutes from './routes/auth/google';
const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://playful-llama-74554f.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use('/auth', googleAuthRoutes);
app.use('/api/documents', documentRoutes);
// app.use('/api/auth', authRoutes);      // ✅ Now this works
app.use('/api/docs', docRoutes);

export default app;
