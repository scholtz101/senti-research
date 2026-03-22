import axios from 'axios';

const ENDPOINT = 'https://query.wikidata.org/sparql';

export async function search(query) {
  const results = [];
  try {
    // Search for organizations and persons
    const sparql = `
      SELECT ?item ?itemLabel ?itemDescription ?instanceLabel ?country ?countryLabel ?website WHERE {
        SERVICE wikibase:mwapi {
          bd:serviceParam wikibase:endpoint "www.wikidata.org";
                          wikibase:api "EntitySearch";
                          mwapi:search "${query.replace(/"/g, '')}";
                          mwapi:language "de".
          ?item wikibase:apiOutputItem mwapi:item.
        }
        OPTIONAL { ?item wdt:P31 ?instance. }
        OPTIONAL { ?item wdt:P17 ?country. }
        OPTIONAL { ?item wdt:P856 ?website. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
      } LIMIT 5
    `;
    const resp = await axios.get(ENDPOINT, {
      params: { query: sparql, format: 'json' },
      timeout: 10000,
      headers: {
        'User-Agent': 'SentiResearch/1.0',
        'Accept': 'application/sparql-results+json'
      }
    });
    const bindings = resp.data?.results?.bindings || [];
    const seen = new Set();
    for (const b of bindings) {
      const id = b.item?.value;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const qid = id.split('/').pop();
      results.push({
        id: `wd_${qid}`,
        type: 'entity',
        label: b.itemLabel?.value || query,
        source: 'Wikidata',
        data: {
          name: b.itemLabel?.value,
          description: b.itemDescription?.value,
          instance: b.instanceLabel?.value,
          country: b.countryLabel?.value,
          website: b.website?.value,
          wikidataId: qid,
          url: `https://www.wikidata.org/wiki/${qid}`
        }
      });
    }
  } catch (e) {
    console.error('Wikidata error:', e.message);
  }
  return results;
}
