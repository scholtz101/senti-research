# Senti-Research — LLM Project Guide

**Stand:** 2026-03-23
**Status:** Lauffähig (Docker-ready)

## Zweck

Business-Partner-Recherche-Tool mit interaktiver Netzwerk-Graph-Visualisierung. Zeigt Unternehmens- und Personen-Beziehungen als Graph (vis.js). Durchsucht automatisch öffentliche Datenquellen.

## Stack

- **Runtime:** Node.js 22 (ESM)
- **Backend:** Express
- **Frontend:** vis.js (Netzwerkgraph), Bootstrap 5
- **Scraping:** cheerio, axios
- **Container:** Dockerfile vorhanden

## Datenquellen

- GLEIF/LEI (Unternehmensregister)
- Wikidata
- North Data
- Handelsregister
- GitHub
- Brave Search API

## Projektstruktur

```
src/           # Express-Server
public/        # Frontend (Graph-UI)
Dockerfile     # Docker-Image
package.json
```

## Starten

```bash
npm install
npm start                    # Port 18795
# oder
PORT=3000 npm start
# oder Docker
docker build -t senti-research .
docker run -p 18795:18795 senti-research
```

## Features

- Interaktiver Netzwerk-Graph (Zoom, Drag, Cluster)
- 10-Minuten-Cache für API-Anfragen
- Multi-Source-Suche mit automatischer Deduplizierung
