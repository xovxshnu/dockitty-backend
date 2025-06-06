import express from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Setup session
router.use(session({
  secret: process.env.SESSION_SECRET || 'dockitty_secret',
  resave: false,
  saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());

// Passport Google Strategy
passport.use(new GoogleStrategy.Strategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  // TODO: Save/find user in DB
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Start Google Auth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;
    const token = "your-generated-jwt"; // TODO: generate JWT here
    res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
  }
);

export default router;
