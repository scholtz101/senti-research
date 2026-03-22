import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import NodeCache from 'node-cache';

import { search as searchGleif } from './sources/gleif.js';
import { search as searchWikidata } from './sources/wikidata.js';
import { search as searchNorthData } from './sources/northdata.js';
import { search as searchHandelsregister } from './sources/handelsregister.js';
import { search as searchWeb } from './sources/websearch.js';
import { searchCompany as searchGitHub } from './sources/github.js';
import { buildGraph } from './graph-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Main search endpoint
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const cacheKey = `search_${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[cache hit] ${query}`);
    return res.json(cached);
  }

  console.log(`[search] "${query}"`);
  const startTime = Date.now();

  // Run all sources in parallel (with individual timeouts)
  const [gleifRes, wdResults, ndResults, hrResults, webResults, ghResults] = await Promise.allSettled([
    searchGleif(query),
    searchWikidata(query),
    searchNorthData(query),
    searchHandelsregister(query),
    searchWeb(query),
    searchGitHub(query)
  ]);

  const sourceResults = [
    { source: 'GLEIF (LEI)',     results: gleifRes.status === 'fulfilled' ? gleifRes.value : [] },
    { source: 'Wikidata',        results: wdResults.status === 'fulfilled' ? wdResults.value : [] },
    { source: 'North Data',      results: ndResults.status === 'fulfilled' ? ndResults.value : [] },
    { source: 'Handelsregister', results: hrResults.status === 'fulfilled' ? hrResults.value : [] },
    { source: 'Web-Suche',       results: webResults.status === 'fulfilled' ? webResults.value : [] },
    { source: 'GitHub',          results: ghResults.status === 'fulfilled' ? ghResults.value : [] }
  ];

  // No extra detail fetching needed (GLEIF returns full records)

  const graph = buildGraph(query, sourceResults);

  const response = {
    query,
    durationMs: Date.now() - startTime,
    sources: sourceResults.map(s => ({
      name: s.source,
      count: s.results.length
    })),
    results: sourceResults.flatMap(s => s.results),
    graph
  };

  cache.set(cacheKey, response);
  res.json(response);
});

const PORT = process.env.PORT || 18795;
app.listen(PORT, () => {
  console.log(`SentiResearch running on port ${PORT}`);
});
