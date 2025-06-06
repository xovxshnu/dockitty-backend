import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import prisma from '../../prisma/client'; // adjust this path based on your setup

const router = express.Router();

// Setup passport session (required even for JWT-based flow)
router.use(session({
  secret: process.env.SESSION_SECRET || 'dockittysecret',
  resave: false,
  saveUninitialized: true
}));

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0].value;

      if (!email) return done(null, false);

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName,
            id: profile.id, // store as `id` or change to a UUID if you want
          },
        });
      }

      return done(null, user);
    }
  )
);

// Route to trigger Google OAuth login
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback after Google login
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req: any, res) => {
    const user = req.user;

    // Issue JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with JWT in query (or set a cookie if preferred)
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
  }
);

export default router;
