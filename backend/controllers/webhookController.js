import crypto from 'crypto';
import { Repository } from '../models/Repository.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { Project } from '../models/Project.js';
import { emitProjectEvent } from '../config/socket.js';
import { createNotification } from '../services/notificationService.js';
import { config } from '../config/env.js';

/**
 * Middleware to verify GitHub Webhook Signature
 */
export const verifyGithubSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const secret = config.githubWebhookSecret;

  if (!signature) {
    console.warn('[Webhook] Rejected: x-hub-signature-256 header is missing');
    return res.status(401).json({ success: false, message: 'Signature missing' });
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    // Use the raw body captured by Express middleware if available, else stringify req.body
    const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;

    const signatureBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);

    if (
      signatureBuffer.length !== digestBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, digestBuffer)
    ) {
      console.warn('[Webhook] Rejected: Signature mismatch');
      return res.status(401).json({ success: false, message: 'Invalid signature verification' });
    }

    next();
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return res.status(500).json({ success: false, message: 'Signature verification failed' });
  }
};

/**
 * Handle incoming GitHub Webhook Events
 * POST /api/webhooks/github
 */
export const handleGithubWebhook = async (req, res) => {
  try {
    const eventType = req.headers['x-github-event'];
    const payload = req.body;

    if (!eventType || !payload) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    const { repository, sender } = payload;
    if (!repository || !sender) {
      return res.status(200).json({ success: true, message: 'Ignored webhook (no repository or sender)' });
    }

    const githubRepoId = repository.id.toString();

    // 1. Find corresponding repository in DevFlow database
    const repo = await Repository.findOne({ githubRepoId });
    if (!repo) {
      console.info(`[Webhook] Ignored event for repository not connected to any project: ${repository.full_name}`);
      return res.status(200).json({ success: true, message: 'Repository not registered in DevFlow' });
    }

    const projectId = repo.projectId;

    // 2. Find matching user in DevFlow by githubId or username
    const senderId = sender.id.toString();
    const senderUsername = sender.login;

    const user = await User.findOne({
      $or: [
        { githubId: senderId },
        { username: senderUsername }
      ]
    });
    const userId = user ? user._id : null;

    let actionText = '';
    let metadata = {
      source: 'github',
      repoName: repository.name,
      repoOwner: repository.owner.login,
      senderUsername,
      senderAvatar: sender.avatar_url,
    };

    // 3. Process events
    switch (eventType) {
      case 'push': {
        const ref = payload.ref || '';
        const branch = ref.replace('refs/heads/', '');
        const commits = payload.commits || [];
        const count = commits.length;

        if (count === 0) {
          return res.status(200).json({ success: true, message: 'Ignored empty push event' });
        }

        const commitWord = count === 1 ? 'commit' : 'commits';
        actionText = `pushed ${count} ${commitWord} to ${branch}`;
        metadata = {
          ...metadata,
          branch,
          commitsCount: count,
          commits: commits.slice(0, 5).map(c => ({
            sha: c.id,
            message: c.message,
            url: c.url,
            authorName: c.author.name
          }))
        };
        break;
      }

      case 'pull_request': {
        const { action, pull_request } = payload;
        const prNumber = pull_request.number;
        const prTitle = pull_request.title;
        const merged = pull_request.merged;

        if (action === 'closed' && merged) {
          actionText = `merged PR #${prNumber}`;
        } else if (action === 'closed' && !merged) {
          actionText = `closed PR #${prNumber}`;
        } else if (action === 'opened') {
          actionText = `opened PR #${prNumber}`;
          try {
            const project = await Project.findById(projectId);
            if (project && project.owner) {
              await createNotification({
                recipient: project.owner,
                sender: userId || project.owner,
                project: projectId,
                type: 'PR_OPENED',
                title: 'Pull Request Opened',
                message: `PR #${prNumber} "${prTitle}" was opened in repository "${repository.name}"`,
                link: pull_request.html_url,
              });
            }
          } catch (notifErr) {
            console.error('Failed to trigger PR opened notification:', notifErr);
          }
        } else if (action === 'reopened') {
          actionText = `reopened PR #${prNumber}`;
        } else {
          // Ignore other PR actions (e.g. labeled, assigned) to avoid clutter
          return res.status(200).json({ success: true, message: `Ignored PR action: ${action}` });
        }

        metadata = {
          ...metadata,
          prNumber,
          prTitle,
          prAction: action,
          merged,
          url: pull_request.html_url
        };
        break;
      }

      case 'issues': {
        const { action, issue } = payload;
        const issueNumber = issue.number;
        const issueTitle = issue.title;

        if (['opened', 'closed', 'reopened'].includes(action)) {
          actionText = `${action} issue #${issueNumber}`;
        } else {
          return res.status(200).json({ success: true, message: `Ignored issue action: ${action}` });
        }

        metadata = {
          ...metadata,
          issueNumber,
          issueTitle,
          issueAction: action,
          url: issue.html_url
        };
        break;
      }

      case 'issue_comment': {
        const { action, issue, comment } = payload;
        const issueNumber = issue.number;
        const issueTitle = issue.title;

        if (action === 'created') {
          actionText = `commented on issue #${issueNumber}`;
        } else {
          return res.status(200).json({ success: true, message: `Ignored comment action: ${action}` });
        }

        metadata = {
          ...metadata,
          issueNumber,
          issueTitle,
          commentId: comment.id,
          commentBody: comment.body.length > 100 ? `${comment.body.slice(0, 100)}...` : comment.body,
          url: comment.html_url
        };
        break;
      }

      case 'release': {
        const { action, release } = payload;
        const tagName = release.tag_name;
        const releaseName = release.name || tagName;

        if (action === 'published') {
          actionText = `published release ${tagName}`;
        } else {
          return res.status(200).json({ success: true, message: `Ignored release action: ${action}` });
        }

        metadata = {
          ...metadata,
          tag: tagName,
          releaseName,
          url: release.html_url
        };
        break;
      }

      default:
        return res.status(200).json({ success: true, message: `Unsupported event type: ${eventType}` });
    }

    // 4. Create and save Activity log
    const newActivity = new Activity({
      user: userId,
      project: projectId,
      action: actionText,
      metadata,
    });

    await newActivity.save();

    // 5. Populate and emit socket event for real-time dashboard updates
    const populatedActivity = await Activity.findById(newActivity._id)
      .populate('user', '_id username email avatar');

    emitProjectEvent(projectId, 'activity-added', populatedActivity);

    console.info(`[Webhook] Processed ${eventType} event for repo: ${repository.name} (mapped to Project: ${projectId})`);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed and activity logged successfully',
      activity: populatedActivity,
    });
  } catch (error) {
    console.error('[Webhook] Handler error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process webhook' });
  }
};
