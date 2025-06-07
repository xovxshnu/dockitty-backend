import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import session from 'express-session';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = express.Router();

// Setup session (optional, only needed if using session-based auth)
router.use(
  session({
    secret: process.env.SESSION_SECRET || 'dockitty_secret',
    resave: false,
    saveUninitialized: false,
  })
);

router.use(passport.initialize());
router.use(passport.session());

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        // In real app, save/find user in DB here
        const user = {
          id: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0].value,
        };

        // Attach user object to request
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

// Start Google Auth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback handler
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false, // Disable session, using JWT
  }),
  (req, res) => {
    const user = req.user as { id: string; email?: string; name?: string };

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '1d',
      }
    );

    // Redirect to frontend with JWT
    res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
  }
);

export default router;
