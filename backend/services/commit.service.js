import { GitHubIntegration } from '../models/GitHubIntegration.js';

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'DevFlow-App',
});

/**
 * Fetch commits for a specific repository from GitHub REST API
 */
export const fetchCommits = async (userId, owner, repoName, page = 1, perPage = 30) => {
  const integration = await GitHubIntegration.findOne({ userId });
  if (!integration || !integration.accessToken) {
    throw new Error('GitHub account not connected or authorization expired.');
  }

  const url = `https://api.github.com/repos/${owner}/${repoName}/commits?page=${page}&per_page=${perPage}`;
  const response = await fetch(url, {
    headers: getHeaders(integration.accessToken),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch commits from GitHub (HTTP ${response.status})`);
  }

  const commits = await response.json();
  return commits.map((item) => ({
    sha: item.sha,
    message: item.commit.message,
    authorName: item.commit.author?.name || item.author?.login || 'Unknown',
    authorAvatar: item.author?.avatar_url || '',
    date: item.commit.author?.date ? new Date(item.commit.author.date) : null,
    htmlUrl: item.html_url,
  }));
};
