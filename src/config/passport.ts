import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        // You can look up user in DB or create here
        const user = {
          id: profile.id,
          email: profile.emails?.[0].value,
          name: profile.displayName,
        };

        const token = jwt.sign(user, process.env.JWT_SECRET!, {
          expiresIn: '1d',
        });

        // Attach token to user object for frontend
        return done(null, { ...user, token });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Optional for future session support
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj as Express.User);
});
