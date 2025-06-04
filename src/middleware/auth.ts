import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  // Check if user exists in DB or create one
  // You can use Prisma here to find/create
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, false));
passport.deserializeUser((user, done) => done(null, false));
