import passport from 'passport';
import { Profile, Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//       callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
//     },
//     async (accessToken, refreshToken, profile: Profile, done) => {
//       // In production, you'd store/retrieve user from DB here
//       return done(null, {
//         id: profile.id,
//         email: profile.emails && profile.emails[0] ? profile.emails[0].value : '',

//       });
//     }
//   )
// );

// // Serialize user into session
// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// // Deserialize user from session
// passport.deserializeUser((user, done) => {
//   done(null, user as Express.User);
// });
