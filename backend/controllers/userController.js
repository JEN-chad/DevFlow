import { User } from '../models/User.js';

/**
 * Search users by username or email
 * GET /api/users/search?q=<query>
 */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    // Return empty results if query is empty or too short
    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        users: [],
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    // Find users matching query, omitting current user for clean invite experience
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { email: searchRegex }
      ],
      _id: { $ne: req.user._id }
    })
      .select('_id username email avatar role')
      .limit(10);

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search users due to server error',
    });
  }
};
