import express from 'express';
import passport from 'passport';
import {
  handleGitHubCallback,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
} from '../controllers/authController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route to initiate GitHub OAuth
router.get(
  '/github',
  passport.authenticate('github', { session: false, scope: ['user:email', 'repo'] })
);

// Route for GitHub Callback
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  handleGitHubCallback
);

// Route to refresh Access Token
router.post('/refresh', refreshAccessToken);

// Route to Logout
router.post('/logout', logoutUser);

// Route to get Current User profile
router.get('/me', protectRoute, getCurrentUser);

export default router;
