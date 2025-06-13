import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { User } from '../types/user'; // Create a User interface with id, name, email

// Replace with actual Prisma DB logic if needed
const findOrCreateUser = async (profile: Profile): Promise<User> => {
  return {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails?.[0]?.value ?? '', // ensure email is never undefined
  };
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile);
       return done(null, {
  id: profile.id,
  email: profile.emails?.[0].value || "no-email@example.com",
  name: profile.displayName || "No Name",
} as User);
 // ✅ this matches User interface
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);

// No sessions — use JWT instead
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user as User);
});
