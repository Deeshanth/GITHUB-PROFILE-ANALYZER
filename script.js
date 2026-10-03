// GitHub Profile Analyzer - Vanilla JS Application

// Language Color Mapping
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Vue: '#41b883',
  Shell: '#89e051',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Lua: '#000080'
};

// DOM Elements
const searchForm = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');
const presetChips = document.querySelectorAll('.preset-chip');
const loader = document.getElementById('loader');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const dashboard = document.getElementById('dashboard');

// Profile Elements
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userLogin = document.getElementById('user-login');
const userBio = document.getElementById('user-bio');
const joinedDate = document.getElementById('joined-date');
const githubLink = document.getElementById('github-link');
const userLocation = document.getElementById('user-location');
const userCompany = document.getElementById('user-company');
const userBlog = document.getElementById('user-blog');
const userTwitter = document.getElementById('user-twitter');

// Stats Elements
const statRepos = document.getElementById('stat-repos');
const statStars = document.getElementById('stat-stars');
const statFollowers = document.getElementById('stat-followers');
const statFollowing = document.getElementById('stat-following');

// Container Elements
const languageBarsContainer = document.getElementById('language-bars-container');
const featuredRepoContainer = document.getElementById('featured-repo-container');
const reposGrid = document.getElementById('repos-grid');

// Utility Functions
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
}

// UI State Handlers
function showLoader() {
  loader.classList.remove('hidden');
  errorBanner.classList.add('hidden');
  dashboard.classList.add('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
}

function showError(msg) {
  hideLoader();
  errorMessage.textContent = msg;
  errorBanner.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

function showDashboard() {
  hideLoader();
  errorBanner.classList.add('hidden');
  dashboard.classList.remove('hidden');
}

// Fetch GitHub Profile & Repositories
async function analyzeProfile(username) {
  const sanitizedUsername = username.trim();
  if (!sanitizedUsername) return;

  showLoader();

  try {
    // Parallel Fetch for Profile and Repositories
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${sanitizedUsername}`),
      fetch(`https://api.github.com/users/${sanitizedUsername}/repos?per_page=100&sort=updated`)
    ]);

    // Handle User Profile Errors
    if (userRes.status === 404) {
      showError(`User "${sanitizedUsername}" was not found on GitHub. Check spelling and try again.`);
      return;
    }
    
    if (userRes.status === 403) {
      showError('GitHub API rate limit exceeded (60 requests/hour). Please try again later.');
      return;
    }

    if (!userRes.ok) {
      showError(`Failed to fetch user profile (Status: ${userRes.status}).`);
      return;
    }

    const userData = await userRes.json();
    const reposData = reposRes.ok ? await reposRes.json() : [];

    // Process & Render
    renderProfile(userData);
    renderStats(userData, reposData);
    renderLanguages(reposData);
    renderFeaturedRepo(reposData);
    renderRepositories(reposData);

    showDashboard();
  } catch (err) {
    console.error('Fetch Error:', err);
    showError('Network error occurred. Please check your connection and try again.');
  }
}

// Render User Profile Metadata
function renderProfile(user) {
  userAvatar.src = user.avatar_url || '';
  userAvatar.alt = `${user.login}'s Avatar`;
  userName.textContent = user.name || user.login;
  userLogin.textContent = `@${user.login}`;
  userLogin.href = user.html_url;
  userBio.textContent = user.bio || 'No bio available for this profile.';
  joinedDate.textContent = `Joined ${formatDate(user.created_at)}`;
  githubLink.href = user.html_url;

  // Location
  if (user.location) {
    userLocation.textContent = user.location;
    document.getElementById('location-item').style.display = 'flex';
  } else {
    userLocation.textContent = 'Not specified';
  }

  // Company
  if (user.company) {
    userCompany.textContent = user.company;
    document.getElementById('company-item').style.display = 'flex';
  } else {
    userCompany.textContent = 'Not specified';
  }

  // Blog/Website
  if (user.blog) {
    let blogUrl = user.blog;
    if (!blogUrl.startsWith('http://') && !blogUrl.startsWith('https://')) {
      blogUrl = `https://${blogUrl}`;
    }
    userBlog.textContent = user.blog;
    userBlog.href = blogUrl;
  } else {
    userBlog.textContent = 'Not specified';
    userBlog.removeAttribute('href');
  }

  // Twitter/X
  if (user.twitter_username) {
    userTwitter.textContent = `@${user.twitter_username}`;
    userTwitter.href = `https://twitter.com/${user.twitter_username}`;
  } else {
    userTwitter.textContent = 'Not specified';
    userTwitter.removeAttribute('href');
  }
}

// Render Key Numerical Stats
function renderStats(user, repos) {
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  
  statRepos.textContent = formatNumber(user.public_repos || 0);
  statStars.textContent = formatNumber(totalStars);
  statFollowers.textContent = formatNumber(user.followers || 0);
  statFollowing.textContent = formatNumber(user.following || 0);
}

// Render Top Programming Languages
function renderLanguages(repos) {
  languageBarsContainer.innerHTML = '';

  if (!repos || repos.length === 0) {
    languageBarsContainer.innerHTML = '<p class="text-secondary" style="font-size:0.9rem;">No public repositories found to analyze languages.</p>';
    return;
  }

  const langCounts = {};
  let totalWithLanguage = 0;

  repos.forEach(repo => {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      totalWithLanguage++;
    }
  });

  if (totalWithLanguage === 0) {
    languageBarsContainer.innerHTML = '<p class="text-secondary" style="font-size:0.9rem;">No language data available for these repositories.</p>';
    return;
  }

  // Sort languages by repository frequency
  const sortedLangs = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Take top 5

  sortedLangs.forEach(([lang, count]) => {
    const percentage = ((count / totalWithLanguage) * 100).toFixed(1);
    const color = LANGUAGE_COLORS[lang] || '#8b949e';

    const langItem = document.createElement('div');
    langItem.className = 'lang-item';
    langItem.innerHTML = `
      <div class="lang-info">
        <div class="lang-name-group">
          <span class="lang-color-dot" style="background-color: ${color}"></span>
          <span>${escapeHTML(lang)}</span>
        </div>
        <span>${percentage}%</span>
      </div>
      <div class="lang-bar-bg">
        <div class="lang-bar-fill" style="width: ${percentage}%; background-color: ${color}"></div>
      </div>
    `;
    languageBarsContainer.appendChild(langItem);
  });
}

// Render Most Starred / Highlighted Repo
function renderFeaturedRepo(repos) {
  featuredRepoContainer.innerHTML = '';

  if (!repos || repos.length === 0) {
    featuredRepoContainer.innerHTML = '<p class="text-secondary" style="font-size:0.9rem;">No public repositories available.</p>';
    return;
  }

  // Copy array and sort by stargazers_count descending
  const sortedRepos = [...repos].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  const topRepo = sortedRepos[0];

  if (!topRepo) {
    featuredRepoContainer.innerHTML = '<p class="text-secondary">No repository statistics found.</p>';
    return;
  }

  const langColor = topRepo.language ? (LANGUAGE_COLORS[topRepo.language] || '#8b949e') : 'transparent';

  const card = document.createElement('div');
  card.className = 'featured-card';
  card.innerHTML = `
    <div class="featured-title">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="color: var(--accent-blue);">
        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-11h-8a1 1 0 0 0-1 1v11h1.75a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 2 13.25Zm4.75 3.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5Zm0 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5Z"></path>
      </svg>
      <a href="${topRepo.html_url}" target="_blank" rel="noopener">${escapeHTML(topRepo.name)}</a>
    </div>
    <p class="featured-desc">${escapeHTML(topRepo.description || 'No description provided.')}</p>
    <div class="featured-stats">
      ${topRepo.language ? `
        <div class="meta-group">
          <span class="lang-color-dot" style="background-color: ${langColor}"></span>
          <span>${escapeHTML(topRepo.language)}</span>
        </div>
      ` : ''}
      <div class="meta-group">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
        <span>${formatNumber(topRepo.stargazers_count)} stars</span>
      </div>
      <div class="meta-group">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.372h-1.5A2.25 2.25 0 0 1 3.5 6.122v-.878a2.25 2.25 0 1 1 1.5 0Z"/></svg>
        <span>${formatNumber(topRepo.forks_count)} forks</span>
      </div>
    </div>
  `;

  featuredRepoContainer.appendChild(card);
}

// Render Top Public Repositories Grid
function renderRepositories(repos) {
  reposGrid.innerHTML = '';

  if (!repos || repos.length === 0) {
    reposGrid.innerHTML = '<p class="text-secondary" style="grid-column: 1/-1;">No public repositories found.</p>';
    return;
  }

  // Sort by stargazers_count descending and take top 9
  const topRepos = [...repos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 9);

  topRepos.forEach(repo => {
    const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] || '#8b949e') : 'transparent';

    const card = document.createElement('div');
    card.className = 'repo-card';
    card.innerHTML = `
      <div class="repo-header">
        <div class="repo-name-wrapper">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="color: var(--text-secondary); flex-shrink:0;">
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-11h-8a1 1 0 0 0-1 1v11h1.75a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 2 13.25Zm4.75 3.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5Zm0 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5Z"></path>
          </svg>
          <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener">${escapeHTML(repo.name)}</a>
        </div>
        <p class="repo-desc">${escapeHTML(repo.description || 'No description provided.')}</p>
      </div>

      <div class="repo-footer">
        ${repo.language ? `
          <div class="meta-group">
            <span class="lang-color-dot" style="background-color: ${langColor}"></span>
            <span>${escapeHTML(repo.language)}</span>
          </div>
        ` : '<span></span>'}
        
        <div class="repo-metrics">
          <div class="meta-group" title="Stars">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
            <span>${formatNumber(repo.stargazers_count)}</span>
          </div>
          <div class="meta-group" title="Forks">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.372h-1.5A2.25 2.25 0 0 1 3.5 6.122v-.878a2.25 2.25 0 1 1 1.5 0Z"/></svg>
            <span>${formatNumber(repo.forks_count)}</span>
          </div>
        </div>
      </div>
    `;

    reposGrid.appendChild(card);
  });
}

// Event Listeners
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value;
  analyzeProfile(username);
});

presetChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const username = chip.getAttribute('data-user');
    usernameInput.value = username;
    analyzeProfile(username);
  });
});

// Initial Load with default user 'octocat'
document.addEventListener('DOMContentLoaded', () => {
  usernameInput.value = 'octocat';
  analyzeProfile('octocat');
});
