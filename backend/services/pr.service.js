import { GitHubIntegration } from '../models/GitHubIntegration.js';

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'DevFlow-App',
});

/**
 * Fetch pull requests for a specific repository from GitHub REST API
 */
export const fetchPullRequests = async (userId, owner, repoName, state = 'all', page = 1, perPage = 30) => {
  const integration = await GitHubIntegration.findOne({ userId });
  if (!integration || !integration.accessToken) {
    throw new Error('GitHub account not connected or authorization expired.');
  }

  const url = `https://api.github.com/repos/${owner}/${repoName}/pulls?state=${state}&page=${page}&per_page=${perPage}`;
  const response = await fetch(url, {
    headers: getHeaders(integration.accessToken),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch pull requests from GitHub (HTTP ${response.status})`);
  }

  const prs = await response.json();
  return prs.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    state: item.state,
    user: {
      username: item.user?.login || 'Unknown',
      avatar: item.user?.avatar_url || '',
    },
    createdAt: item.created_at ? new Date(item.created_at) : null,
    closedAt: item.closed_at ? new Date(item.closed_at) : null,
    mergedAt: item.merged_at ? new Date(item.merged_at) : null,
    htmlUrl: item.html_url,
  }));
};
