import express from 'express';
import passport from 'passport';
import session from 'express-session';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import './config/passport'; // import this to initialize the strategy

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
