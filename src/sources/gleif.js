import axios from 'axios';

// GLEIF LEI (Legal Entity Identifier) - 100% free, no auth required
// Covers ~2.5M companies globally
const GLEIF_BASE = 'https://api.gleif.org/api/v1';

export async function search(query) {
  const results = [];
  try {
    const searchResp = await axios.get(`${GLEIF_BASE}/lei-records`, {
      params: { 'filter[entity.legalName]': query, 'page[size]': 8 },
      timeout: 10000,
      headers: { 'User-Agent': 'SentiResearch/1.0', 'Accept': 'application/json' }
    });

    const records = searchResp.data?.data || [];
    for (const record of records) {
      const attr = record.attributes;
      const entity = attr?.entity || {};
      const lei = attr?.lei;

      results.push({
        id: `gleif_${lei}`,
        type: 'company',
        label: entity.legalName?.name || entity.legalName || query,
        source: 'GLEIF (LEI)',
        data: {
          name: entity.legalName?.name || entity.legalName,
          lei,
          legalForm: entity.legalForm?.id,
          status: entity.status,
          jurisdiction: entity.jurisdiction,
          registeredAs: entity.registeredAs,
          address: [
            entity.legalAddress?.addressLines?.join(' '),
            entity.legalAddress?.city,
            entity.legalAddress?.country
          ].filter(Boolean).join(', '),
          url: `https://search.gleif.org/#/record/${lei}`
        }
      });
    }
  } catch (e) {
    console.error('GLEIF error:', e.message);
  }
  return results;
}
