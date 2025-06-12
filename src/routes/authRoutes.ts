import express from 'express';
// import passport from 'passport';
// import jwt from 'jsonwebtoken';

const router = express.Router();

// Google Auth routes (currently commented out)
/*
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  (req, res) => {
    const user = req.user as Express.User;

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
  }
);
*/

export default router;
