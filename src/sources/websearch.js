import axios from 'axios';

// Uses Brave Search API (available in this environment via env var)
export async function search(query) {
  const results = [];
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    // Fallback: DuckDuckGo HTML scrape for specific entities
    return searchDDGFallback(query);
  }

  try {
    const resp = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: { q: `"${query}" Unternehmen OR Firma OR GmbH OR AG`, count: 8 },
      timeout: 8000,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    });
    const webResults = resp.data?.web?.results || [];
    for (let i = 0; i < Math.min(webResults.length, 5); i++) {
      const r = webResults[i];
      results.push({
        id: `web_${i}_${r.url?.slice(-20)}`,
        type: 'info',
        label: r.title?.slice(0, 60) || r.url,
        source: 'Web-Suche',
        data: {
          title: r.title,
          description: r.description,
          url: r.url
        }
      });
    }
  } catch (e) {
    console.error('Web search error:', e.message);
  }
  return results;
}

async function searchDDGFallback(query) {
  const results = [];
  try {
    // Try exact entity match
    const resp = await axios.get('https://api.duckduckgo.com/', {
      params: { q: query, format: 'json', no_html: 1, skip_disambig: 0 },
      timeout: 8000,
      headers: { 'User-Agent': 'SentiResearch/1.0' }
    });
    const data = resp.data;
    if (data?.AbstractText) {
      results.push({
        id: `ddg_main`,
        type: 'info',
        label: (data.Heading || query).slice(0, 60),
        source: 'DuckDuckGo',
        data: {
          name: data.Heading,
          description: data.AbstractText,
          url: data.AbstractURL
        }
      });
    }
    for (let i = 0; i < Math.min((data?.RelatedTopics || []).length, 5); i++) {
      const t = data.RelatedTopics[i];
      if (t?.Text && t?.FirstURL) {
        results.push({
          id: `ddg_rel_${i}`,
          type: 'info',
          label: t.Text.slice(0, 60),
          source: 'DuckDuckGo',
          data: { description: t.Text, url: t.FirstURL }
        });
      }
    }
  } catch (e) {
    console.error('DDG fallback error:', e.message);
  }
  return results;
}
