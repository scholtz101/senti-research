import axios from 'axios';
import * as cheerio from 'cheerio';

export async function search(query) {
  const results = [];
  try {
    const resp = await axios.get('https://www.northdata.de/suche', {
      params: { query },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SentiResearch/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'de-DE,de;q=0.9'
      }
    });
    const $ = cheerio.load(resp.data);

    // North Data search results
    $('.search-result, .result-item, [class*="company"], [data-company-id]').each((i, el) => {
      if (i >= 8) return;
      const name = $(el).find('h2, h3, .name, [class*="name"]').first().text().trim();
      const location = $(el).find('.location, [class*="location"], [class*="address"]').first().text().trim();
      const legalForm = $(el).find('.legal-form, [class*="legal"]').first().text().trim();
      const status = $(el).find('.status, [class*="status"]').first().text().trim();
      const link = $(el).find('a').first().attr('href');

      if (name) {
        results.push({
          id: `nd_${i}_${name.replace(/\s/g, '_').slice(0, 20)}`,
          type: 'company',
          label: name,
          source: 'North Data',
          data: {
            name,
            location,
            legalForm,
            status,
            url: link ? `https://www.northdata.de${link}` : null
          }
        });
      }
    });

    // Fallback: try generic link extraction if nothing found
    if (results.length === 0) {
      $('a[href*="/company"], a[href*="/Company"]').each((i, el) => {
        if (i >= 5) return;
        const name = $(el).text().trim();
        const href = $(el).attr('href');
        if (name && name.length > 2) {
          results.push({
            id: `nd_fallback_${i}`,
            type: 'company',
            label: name,
            source: 'North Data',
            data: { name, url: href ? `https://www.northdata.de${href}` : null }
          });
        }
      });
    }
  } catch (e) {
    console.error('North Data error:', e.message);
  }
  return results;
}
