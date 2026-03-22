import axios from 'axios';
import * as cheerio from 'cheerio';

export async function search(query) {
  const results = [];
  try {
    // Handelsregister Bekanntmachungen search
    const resp = await axios.post(
      'https://www.handelsregister.de/rp_web/ergebnisse.xhtml',
      new URLSearchParams({
        'form': 'ergebnisse',
        'suchTyp': 'n',
        'schlagwoerter': query,
        'schlagwortOptionen': '2',
        'bundesland': '',
        'registernummer': '',
        'registerart': '',
        'niederlassung': '',
        'registergericht': ''
      }),
      {
        timeout: 12000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SentiResearch/1.0)',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html',
          'Accept-Language': 'de-DE,de;q=0.9'
        }
      }
    );
    const $ = cheerio.load(resp.data);

    $('table tr, .result-row, [class*="treffer"]').each((i, el) => {
      if (i === 0 || i > 8) return; // skip header
      const cells = $(el).find('td');
      if (cells.length < 2) return;
      const name = $(cells[0]).text().trim();
      const location = $(cells[1]).text().trim();
      const court = $(cells[2])?.text().trim();
      const regNum = $(cells[3])?.text().trim();

      if (name && name.length > 2) {
        results.push({
          id: `hr_${i}_${name.replace(/\s/g, '_').slice(0, 20)}`,
          type: 'company',
          label: name,
          source: 'Handelsregister',
          data: { name, location, court, registrationNumber: regNum }
        });
      }
    });
  } catch (e) {
    console.error('Handelsregister error:', e.message);
  }
  return results;
}
