# Oppdater «Bøker lest»

Nettsiden leser kun `filer/goodreads-read.json`. Den opprinnelige Goodreads-eksporten skal **ikke** legges i det offentlige GitHub-repositoriet: den kan inneholde anmeldelser og private notater.

1. På Goodreads: **My Books → Import and export → Export Library**. Last ned CSV-filen.
2. Kjør `node scripts/import-goodreads.mjs "sti/til/goodreads_library_export.csv"` fra repositoriets rotmappe.
3. Kontroller `filer/goodreads-read.json`, og publiser den oppdaterte filen til GitHub. GitHub Pages oppdaterer nettsiden automatisk etter publisering.

Skriptet tar bare med bøker i `read`-hyllen og lagrer bok-ID, tittel, forfatter, din stjernerangering, sidetall, lesedato og antall gjennomlesninger. Bøker uten lesedato vises under «Uten dato». Sidetotalen regner med gjenlesninger når `Read Count` er oppgitt. Bøker uten sidetall er ikke med i sidetotalen.

