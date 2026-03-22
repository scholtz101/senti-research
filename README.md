# SentiResearch

Geschäftspartner-Recherche Tool mit Netzwerk-Graph-Visualisierung.

## Features
- Parallele Suche in 6 Quellen: GLEIF/LEI, Wikidata, North Data, Handelsregister, Web, GitHub
- Interaktiver Netzwerk-Graph (vis.js) mit Zoom, Drag, Export
- Ergebnis-Dashboard mit Quellen-Breakdown
- 10-Minuten-Caching
- Docker-ready

## Sources
- **GLEIF (LEI)**: ~2.5M Unternehmen weltweit, Legal Entity Identifier, Adressen, Rechtsformen
- **Wikidata**: Personen, Organisationen, Verbindungen (Wikipedia-Daten)
- **North Data**: Deutsche Unternehmensregister-Daten (Scraper)
- **Handelsregister**: Deutsches Handelsregister (Scraper)
- **GitHub**: Tech-Unternehmen & Open-Source-Organisationen
- **Web-Suche**: Brave Search API (optional, via BRAVE_API_KEY env)

## Stack
- Node.js 22 + Express
- vis.js Network Graph
- Bootstrap 5
- Docker

## Run
```bash
npm install
npm start         # Port 18795
PORT=3000 npm start
```

## Docker
```bash
docker build -t senti-research .
docker run -p 18795:18795 senti-research
```
