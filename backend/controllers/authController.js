import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

export const handleGitHubCallback = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }

    // 1. Generate Refresh Token
    const refreshToken = generateRefreshToken(user);

    // 2. Set Refresh Token in secure, HttpOnly cookie
    const isProduction = config.nodeEnv === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 3. Redirect to the frontend oauth-callback page
    const frontendUrl = config.clientUrl;
    return res.redirect(`${frontendUrl}/oauth-callback`);
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Temporary logs for diagnosing production authentication
    console.log("Cookies:", req.cookies);
    console.log("Headers:", req.headers);
    console.log("Refresh Token:", refreshToken);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing',
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    const user = await User.findById(decoded.id).select('-__v');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new Access Token
    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const isProduction = config.nodeEnv === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
