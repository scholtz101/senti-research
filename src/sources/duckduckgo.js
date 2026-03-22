import axios from 'axios';

export async function search(query) {
  const results = [];
  try {
    // DuckDuckGo Instant Answer API (free, no key)
    const resp = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        no_html: 1,
        skip_disambig: 1
      },
      timeout: 8000,
      headers: { 'User-Agent': 'SentiResearch/1.0' }
    });

    const data = resp.data;
    if (!data) return results;

    // Main result
    if (data.AbstractText && data.AbstractText.length > 10) {
      results.push({
        id: `ddg_main_${query.replace(/\s/g, '_').slice(0, 20)}`,
        type: 'info',
        label: data.Heading || query,
        source: 'DuckDuckGo',
        data: {
          name: data.Heading,
          description: data.AbstractText,
          url: data.AbstractURL,
          image: data.Image,
          sourceUrl: data.AbstractSource
        }
      });
    }

    // Related topics
    const topics = data.RelatedTopics || [];
    for (let i = 0; i < Math.min(topics.length, 5); i++) {
      const t = topics[i];
      if (t.Text && t.FirstURL) {
        results.push({
          id: `ddg_rel_${i}`,
          type: 'info',
          label: t.Text.slice(0, 60),
          source: 'DuckDuckGo',
          data: {
            description: t.Text,
            url: t.FirstURL
          }
        });
      }
    }
  } catch (e) {
    console.error('DuckDuckGo error:', e.message);
  }
  return results;
}
