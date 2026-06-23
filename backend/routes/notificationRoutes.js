import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all notification endpoints
router.use(protectRoute);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;
