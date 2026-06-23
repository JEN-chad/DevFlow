import express from 'express';
import { verifyGithubSignature, handleGithubWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Public route for GitHub webhooks (signature verified inside middleware)
router.post('/github', verifyGithubSignature, handleGithubWebhook);

export default router;
