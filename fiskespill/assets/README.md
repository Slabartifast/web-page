# Grafikk i MVP-en

Denne første versjonen bruker `ASSET_MODE = "vector"` og tegner alt direkte i canvas med enkle former.

For å bytte til egne tegninger senere kan du:

1. Beholde spilldata og logikk som den er.
2. Lage egne render-funksjoner som slår opp sprites per type, for eksempel spiller, båt, fisk og kartpynt.
3. Erstatte tegnekodene i `src/main.js` med bildebasert rendering.
4. La datastrukturene i `src/maps.js`, `src/fishData.js` og `src/shop.js` peke til framtidige asset-nøkler.

Siden logikk og rendering er skilt, kan du gradvis bytte ut utseendet uten å skrive om kjernen i spillet.
