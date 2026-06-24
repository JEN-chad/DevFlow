import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/User.js';
import { GitHubIntegration } from '../models/GitHubIntegration.js';
import { config } from './env.js';

export const configurePassport = () => {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.githubClientId,
        clientSecret: config.githubClientSecret,
        callbackURL: config.githubCallbackUrl,
        scope: ['user:email', 'repo'],
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || '';
          const avatar = profile.photos?.[0]?.value || '';
          const username = profile.username || profile.displayName || 'github_user';

          // 1. Locate user by GitHub ID
          let user = await User.findOne({ githubId: profile.id });

          if (!user) {
            // Seed the first user as OWNER, others as DEVELOPER
            const userCount = await User.countDocuments({});
            const role = userCount === 0 ? 'OWNER' : 'DEVELOPER';

            user = new User({
              githubId: profile.id,
              username,
              email,
              avatar,
              role,
            });
            await user.save();
          } else {
            // Update profile properties on login
            user.username = username;
            if (email) user.email = email;
            if (avatar) user.avatar = avatar;
            await user.save();
          }

          // 2. Manage GitHub OAuth Integration credentials
          let integration = await GitHubIntegration.findOne({ userId: user._id });
          if (!integration) {
            integration = new GitHubIntegration({
              userId: user._id,
              accessToken,
              refreshToken,
            });
          } else {
            integration.accessToken = accessToken;
            if (refreshToken) {
              integration.refreshToken = refreshToken;
            }
            integration.connectedAt = new Date();
          }
          await integration.save();

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};
export default passport;
