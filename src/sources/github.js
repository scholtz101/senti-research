import axios from 'axios';

export async function searchCompany(query) {
  const results = [];
  try {
    // GitHub org search
    const resp = await axios.get('https://api.github.com/search/users', {
      params: { q: `${query} type:org`, per_page: 5 },
      timeout: 8000,
      headers: {
        'User-Agent': 'SentiResearch/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    for (const item of resp.data?.items || []) {
      results.push({
        id: `gh_${item.id}`,
        type: 'organization',
        label: item.login,
        source: 'GitHub',
        data: {
          name: item.login,
          url: item.html_url,
          avatarUrl: item.avatar_url,
          type: item.type
        }
      });
    }
  } catch (e) {
    console.error('GitHub error:', e.message);
  }
  return results;
}
