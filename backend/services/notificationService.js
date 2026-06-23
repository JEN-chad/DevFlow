import { Notification } from '../models/Notification.js';
import { getIO } from '../config/socket.js';

/**
 * Creates and sends a notification.
 * @param {Object} params
 * @param {string} params.recipient - Recipient User ID
 * @param {string} params.sender - Sender User ID
 * @param {string} [params.project] - Optional Project ID
 * @param {string} params.type - Enum type of notification
 * @param {string} params.title - Title of notification
 * @param {string} params.message - Content of notification
 * @param {string} [params.link] - Actionable URL link for frontend navigation
 */
export const createNotification = async ({
  recipient,
  sender,
  project,
  type,
  title,
  message,
  link,
}) => {
  try {
    // Avoid sending notification to self
    if (recipient.toString() === sender.toString()) {
      return null;
    }

    // Save to Database
    const notification = await Notification.create({
      recipient,
      sender,
      project,
      type,
      title,
      message,
      link,
    });

    // Populate sender info
    const populated = await Notification.findById(notification._id)
      .populate('sender', '_id username avatar')
      .populate('project', '_id name');

    // Emit via socket
    try {
      const io = getIO();
      const userRoom = `user-${recipient.toString()}`;
      io.to(userRoom).emit('notification-received', populated);
    } catch (socketError) {
      // Socket io might not be fully initialized during testing or initialization
      console.warn('[Notification Service] Socket.io not ready for emission:', socketError.message);
    }

    return populated;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error);
    throw error;
  }
};
