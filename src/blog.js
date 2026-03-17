/* ═══════════════════════════════════════════════════════════
   AI BRAIN — AI Leaders Live Updates (Modular)
   ═══════════════════════════════════════════════════════════ */

const RSS_FEEDS = [
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
  { name: 'DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'NVIDIA', url: 'https://blogs.nvidia.com/blog/category/deep-learning/feed/' },
  { name: 'Meta AI', url: 'https://about.fb.com/news/category/technology/artificial-intelligence/feed/' }
];

const PROXY_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';
const CACHE_KEY = 'ai_blog_cache';
const CACHE_TIME = 8 * 60 * 60 * 1000; // 8 hours (3 updates daily)

// --- XSS Protection Helpers ---
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch (_) {
    // invalid URL
  }
  return '#';
}

export function initBlog() {
  const blogContainer = document.getElementById('ai-blog');
  if (!blogContainer) return;

  renderSkeleton(blogContainer);
  loadFeed(blogContainer);
}

async function loadFeed(container) {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TIME) {
      renderFeed(container, data);
      return;
    }
  }

  try {
    const allPosts = await fetchAllFeeds();
    const sortedPosts = allPosts.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 6);
    
    if (sortedPosts.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: sortedPosts, timestamp: Date.now() }));
      renderFeed(container, sortedPosts);
    } else {
      throw new Error('No posts found');
    }
  } catch (err) {
    console.error('RSS Fetch Error:', err);
    if (cached) {
      const { data } = JSON.parse(cached);
      renderFeed(container, data); // Fallback to stale cache
    } else {
      container.innerHTML = `<div class="text-center"><p style="color: var(--color-text-secondary);">Updates temporarily unavailable. Check back later.</p></div>`;
    }
  }
}

async function fetchAllFeeds() {
  const fetchPromises = RSS_FEEDS.map(feed => 
    fetch(PROXY_URL + encodeURIComponent(feed.url))
      .then(res => res.json())
      .then(json => {
        if (json.status === 'ok') {
          return json.items.map(item => ({
            ...item,
            source: feed.name,
            pubDate: item.pubDate || item.pub_date // Some RSS have different date keys
          }));
        }
        return [];
      })
      .catch(() => [])
  );

  const results = await Promise.all(fetchPromises);
  return results.flat();
}

function renderSkeleton(container) {
  container.innerHTML = `
    <div class="container">
      <div class="section__header reveal">
        <span class="section__badge"><span class="badge-dot"></span> Live Updates</span>
        <h2 class="section__title">AI Leaders Live Blog</h2>
        <p class="section__subtitle">Automated insights and official news from the world's leading AI organizations.</p>
      </div>
      <div class="blog__grid">
        ${Array(3).fill('<div class="blog-card loading-skeleton" style="height: 300px; background: rgba(255,255,255,0.02);"></div>').join('')}
      </div>
    </div>
  `;
}

function renderFeed(container, posts) {
  const gridHtml = posts.map(post => {
    const date = new Date(post.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    // Strip HTML tags from description, then escape for safe rendering
    const rawExcerpt = (post.description || '').replace(/<[^>]*>/g, '').substring(0, 120) + '...';
    const excerpt = escapeHtml(rawExcerpt);
    const title = escapeHtml(post.title);
    const source = escapeHtml(post.source);
    const safeLink = sanitizeUrl(post.link);
    
    return `
      <div class="blog-card reveal">
        <div class="blog-card__header">
          <span class="blog-card__source">${source}</span>
          <span class="blog-card__date">${escapeHtml(date)}</span>
        </div>
        <h3 class="blog-card__title">${title}</h3>
        <p class="blog-card__excerpt">${excerpt}</p>
        <div class="blog-card__footer">
          <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="blog-card__link">
            Read Full Article
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    `;
  }).join('');

  container.querySelector('.blog__grid').innerHTML = gridHtml;
  
  // Trigger reveal animation for new content
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  container.querySelectorAll('.blog-card').forEach(card => observer.observe(card));
}
