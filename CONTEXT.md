# senti-research — CONTEXT

> Maschinenlesbar. Lies das ZUERST.

## TL;DR
- **Live**: Docker (Port 18795)
- **Stack**: Node.js 22, Express, vis.js (Netzwerk-Graph)
- **Version**: Lauffähig | Branch: main
- **Stand**: 26.03.2026

## PRODUKT
- **Problem**: Business-Partner-Netzwerk visualisieren (6 Datenquellen)
- **Lösung**: Graph-basierte Darstellung mit vis.js, Daten aus APIs
- **Nicht-Scope**: Echtzeit-Monitoring

## KRITISCH — Build & Dev
```bash
npm start                  # oder: docker run -p 18795
```

## BEKANNTE FALLEN
- 6 Datenquellen brauchen API-Keys (Brave, Wikidata etc.)
- Scraping unzuverlässig — APIs bevorzugen
