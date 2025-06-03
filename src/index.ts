import app from './app';
import dotenv from 'dotenv';
import cors from 'cors';
import googleAuthRoutes from './routes/auth/google';

dotenv.config();

const PORT = process.env.PORT || 5000;
app.use('/auth', googleAuthRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Dockitty Backend running on http://localhost:${PORT}`);
});