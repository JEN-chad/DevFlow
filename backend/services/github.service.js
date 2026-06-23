import { GitHubIntegration } from '../models/GitHubIntegration.js';
import { Repository } from '../models/Repository.js';

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'DevFlow-App',
});

/**
 * Fetch repositories of the authenticated user from GitHub
 */
export const getRepositories = async (userId) => {
  const integration = await GitHubIntegration.findOne({ userId });
  if (!integration || !integration.accessToken) {
    throw new Error('GitHub account not connected or authorization expired.');
  }

  const response = await fetch(
    'https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100',
    {
      headers: getHeaders(integration.accessToken),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch GitHub repositories (HTTP ${response.status})`);
  }

  const repos = await response.json();
  return repos.map((repo) => ({
    githubRepoId: repo.id.toString(),
    name: repo.name,
    owner: repo.owner.login,
    url: repo.html_url,
    defaultBranch: repo.default_branch || 'main',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    description: repo.description,
  }));
};

/**
 * Search user's repositories or search globally on GitHub
 */
export const searchRepositories = async (userId, query) => {
  const integration = await GitHubIntegration.findOne({ userId });
  if (!integration || !integration.accessToken) {
    throw new Error('GitHub account not connected or authorization expired.');
  }

  if (!query || query.trim() === '') {
    return getRepositories(userId);
  }

  // Fetch user's repos and filter by query locally first (most reliable for owner/collaborator repos)
  const repos = await getRepositories(userId);
  const filtered = repos.filter(repo => 
    repo.name.toLowerCase().includes(query.toLowerCase()) ||
    repo.owner.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length > 0) {
    return filtered;
  }

  // Fallback to GitHub Search API if no local match
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`,
    {
      headers: getHeaders(integration.accessToken),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to search GitHub repositories (HTTP ${response.status})`);
  }

  const data = await response.json();
  return (data.items || []).slice(0, 30).map((repo) => ({
    githubRepoId: repo.id.toString(),
    name: repo.name,
    owner: repo.owner.login,
    url: repo.html_url,
    defaultBranch: repo.default_branch || 'main',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    description: repo.description,
  }));
};

/**
 * Fetch detailed metrics for a specific repository (live from GitHub API)
 */
export const getRepository = async (userId, owner, repoName) => {
  const integration = await GitHubIntegration.findOne({ userId });
  if (!integration || !integration.accessToken) {
    throw new Error('GitHub account not connected or authorization expired.');
  }

  const token = integration.accessToken;
  const headers = getHeaders(token);

  // Fetch basic repo details, contributors and latest commit in parallel
  const [repoRes, contributorsRes, commitsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers }).then(r => r.ok ? r.json() : null),
    fetch(`https://api.github.com/repos/${owner}/${repoName}/contributors?per_page=10`, { headers }).then(r => r.ok ? r.json() : []),
    fetch(`https://api.github.com/repos/${owner}/${repoName}/commits?per_page=1`, { headers }).then(r => r.ok ? r.json() : [])
  ]);

  if (!repoRes) {
    throw new Error(`Repository ${owner}/${repoName} not found on GitHub or unauthorized.`);
  }

  const contributors = (contributorsRes || []).map(c => ({
    username: c.login,
    avatar: c.avatar_url,
    contributions: c.contributions
  }));

  const latestCommitData = commitsRes?.[0] ? {
    sha: commitsRes[0].sha,
    message: commitsRes[0].commit?.message || '',
    authorName: commitsRes[0].commit?.author?.name || commitsRes[0].author?.login || '',
    authorAvatar: commitsRes[0].author?.avatar_url || '',
    date: commitsRes[0].commit?.author?.date ? new Date(commitsRes[0].commit.author.date) : null
  } : null;

  return {
    githubRepoId: repoRes.id.toString(),
    name: repoRes.name,
    owner: repoRes.owner.login,
    url: repoRes.html_url,
    defaultBranch: repoRes.default_branch || 'main',
    starsCount: repoRes.stargazers_count,
    forksCount: repoRes.forks_count,
    openIssuesCount: repoRes.open_issues_count,
    contributorsCount: contributors.length,
    contributors,
    latestCommit: latestCommitData
  };
};

/**
 * Fetch contributors for a repository
 */
export const getContributors = async (userId, owner, repoName) => {
  const integration = await GitHubIntegration.findOne({ userId });
  if (!integration || !integration.accessToken) {
    throw new Error('GitHub account not connected or authorization expired.');
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contributors?per_page=50`, {
    headers: getHeaders(integration.accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch contributors from GitHub');
  }

  const contributors = await response.json();
  return contributors.map(c => ({
    username: c.login,
    avatar: c.avatar_url,
    contributions: c.contributions
  }));
};

/**
 * Sync repository database document with live data from GitHub API
 */
export const syncRepository = async (userId, repositoryId) => {
  const repo = await Repository.findById(repositoryId);
  if (!repo) {
    throw new Error('Repository not found in database.');
  }

  const githubData = await getRepository(userId, repo.owner, repo.name);

  repo.starsCount = githubData.starsCount;
  repo.forksCount = githubData.forksCount;
  repo.openIssuesCount = githubData.openIssuesCount;
  repo.contributorsCount = githubData.contributorsCount;
  repo.contributors = githubData.contributors;
  if (githubData.latestCommit) {
    repo.latestCommit = githubData.latestCommit;
  }
  repo.syncedAt = new Date();

  await repo.save();
  return repo;
};
