// Aggregates all source results into nodes + edges for graph visualization

export function buildGraph(query, sourceResults) {
  const nodes = new Map();
  const edges = [];

  // Root node = the search query
  const rootId = `query_${query.replace(/\s/g, '_').slice(0, 30)}`;
  nodes.set(rootId, {
    id: rootId,
    label: query,
    group: 'query',
    title: `Suchanfrage: ${query}`,
    shape: 'star',
    color: { background: '#ff6b35', border: '#cc4400' },
    size: 30
  });

  let edgeId = 0;

  for (const { source, results } of sourceResults) {
    // Source node
    const sourceNodeId = `source_${source.replace(/\s/g, '_')}`;
    if (!nodes.has(sourceNodeId)) {
      nodes.set(sourceNodeId, {
        id: sourceNodeId,
        label: source,
        group: 'source',
        title: `Datenquelle: ${source}`,
        shape: 'diamond',
        color: { background: '#4a90d9', border: '#2c6aa0' },
        size: 20
      });
      edges.push({ id: edgeId++, from: rootId, to: sourceNodeId, dashes: true, color: '#aaaaaa' });
    }

    for (const result of results) {
      const nodeId = result.id;
      if (nodes.has(nodeId)) continue;

      const group = result.type;
      const colors = {
        company:      { background: '#27ae60', border: '#1a7a40' },
        person:       { background: '#8e44ad', border: '#5e2d7a' },
        organization: { background: '#16a085', border: '#0e6b5a' },
        entity:       { background: '#f39c12', border: '#c07a00' },
        info:         { background: '#7f8c8d', border: '#566667' }
      };
      const color = colors[group] || colors.info;

      // Build tooltip HTML
      const tooltipLines = Object.entries(result.data || {})
        .filter(([, v]) => v && typeof v === 'string' && v.length > 0)
        .map(([k, v]) => `<b>${k}:</b> ${v.length > 80 ? v.slice(0, 80) + '…' : v}`)
        .join('<br>');

      nodes.set(nodeId, {
        id: nodeId,
        label: (result.label || '').slice(0, 40),
        group,
        title: `<div style="max-width:300px"><b>${result.label}</b><br><i>${source}</i><br><br>${tooltipLines}</div>`,
        shape: group === 'person' ? 'ellipse' : 'box',
        color,
        rawData: result.data,
        source: result.source
      });

      edges.push({
        id: edgeId++,
        from: sourceNodeId,
        to: nodeId,
        label: result.type,
        font: { size: 10, align: 'middle' }
      });
    }

    // Connect officers/persons back to companies from same source
    const companies = results.filter(r => r.type === 'company');
    const persons = results.filter(r => r.type === 'person');
    for (const company of companies) {
      for (const person of persons) {
        edges.push({
          id: edgeId++,
          from: company.id,
          to: person.id,
          label: person.data?.position || 'Verbunden',
          dashes: false,
          color: '#8e44ad',
          font: { size: 9 }
        });
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges
  };
}
