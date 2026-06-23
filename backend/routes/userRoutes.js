import express from 'express';
import { searchUsers } from '../controllers/userController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All user search routes require authentication
router.use(protectRoute);

router.get('/search', searchUsers);

export default router;
