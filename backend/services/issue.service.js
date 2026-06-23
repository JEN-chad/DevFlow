import { GitHubIntegration } from '../models/GitHubIntegration.js';

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'DevFlow-App',
});

/**
 * Fetch issues for a specific repository from GitHub REST API
 */
export const fetchIssues = async (userId, owner, repoName, state = 'open', page = 1, perPage = 30) => {
  const integration = await GitHubIntegration.findOne({ userId });
  if (!integration || !integration.accessToken) {
    throw new Error('GitHub account not connected or authorization expired.');
  }

  const url = `https://api.github.com/repos/${owner}/${repoName}/issues?state=${state}&page=${page}&per_page=${perPage}`;
  const response = await fetch(url, {
    headers: getHeaders(integration.accessToken),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch issues from GitHub (HTTP ${response.status})`);
  }

  const issues = await response.json();
  
  // Note: GitHub issues API returns PRs as issues too, we filter them out by checking 'pull_request' field
  return issues
    .filter((item) => !item.pull_request)
    .map((item) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      state: item.state,
      user: {
        username: item.user?.login || 'Unknown',
        avatar: item.user?.avatar_url || '',
      },
      labels: (item.labels || []).map(label => ({
        name: label.name,
        color: label.color,
      })),
      createdAt: item.created_at ? new Date(item.created_at) : null,
      closedAt: item.closed_at ? new Date(item.closed_at) : null,
      htmlUrl: item.html_url,
    }));
};
