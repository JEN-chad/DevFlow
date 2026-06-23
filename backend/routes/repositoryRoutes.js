import express from 'express';
import {
  getConnectedRepositories,
  getUserGitHubRepositories,
  searchUserGitHubRepositories,
  connectRepository,
  disconnectRepository,
  syncRepository,
  getRepositoryDetails,
  getRepositoryAnalytics,
  getRepositoryCommits,
  getRepositoryPulls,
  getRepositoryIssues,
  getRepositoryContributors,
} from '../controllers/repositoryController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';
import { requireProjectRole } from '../middlewares/projectAuth.js';

const router = express.Router();

// General session protection
router.use(protectRoute);

// Fetch all connected repos
router.get('/', getConnectedRepositories);

// GitHub OAuth queries
router.get('/github', getUserGitHubRepositories);
router.get('/github/search', searchUserGitHubRepositories);

// Project specific repository mapping
router.post(
  '/project/:projectId',
  requireProjectRole('OWNER'),
  connectRepository
);

// Individual repository operations
router.get('/:id', getRepositoryDetails);
router.get('/:id/analytics', getRepositoryAnalytics);
router.get('/:id/commits', getRepositoryCommits);
router.get('/:id/pulls', getRepositoryPulls);
router.get('/:id/issues', getRepositoryIssues);
router.get('/:id/contributors', getRepositoryContributors);
router.post('/:id/sync', syncRepository);
router.delete('/:id', disconnectRepository);

export default router;
