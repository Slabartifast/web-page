import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
const output = process.argv[3] || path.join('filer', 'goodreads-read.json');
if (!input) {
  console.error('Usage: node scripts/import-goodreads.mjs <goodreads-export.csv> [output.json]');
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (quoted) throw new Error('CSV has an unfinished quoted field');
  if (field !== '' || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

const rows = parseCsv(fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
const headers = rows.shift();
const needed = ['Book Id', 'Title', 'Author', 'My Rating', 'Number of Pages', 'Date Read', 'Exclusive Shelf', 'Read Count'];
if (!headers || needed.some(name => !headers.includes(name))) throw new Error('Missing Goodreads export columns');
const records = rows.filter(row => row.some(Boolean)).map(row => Object.fromEntries(headers.map((key, index) => [key, row[index] ?? ''])));
const books = records.filter(row => row['Exclusive Shelf'] === 'read').map(row => {
  const rating = Number(row['My Rating']);
  const pages = Number(row['Number of Pages']);
  const readCount = Number(row['Read Count']);
  const rawDate = row['Date Read'];
  const dateRead = /^\d{4}\/\d{2}\/\d{2}$/.test(rawDate) ? rawDate.replaceAll('/', '-') : null;
  return {
    id: row['Book Id'],
    title: row.Title.trim(),
    author: row.Author.trim(),
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
    pages: Number.isInteger(pages) && pages > 0 ? pages : null,
    dateRead,
    readCount: Number.isInteger(readCount) && readCount > 0 ? readCount : 1,
  };
});
if (books.some(book => !/^\d+$/.test(book.id) || !book.title)) throw new Error('Invalid Goodreads book ID or title');
books.sort((a, b) => (b.dateRead || '').localeCompare(a.dateRead || '') || a.title.localeCompare(b.title, 'no'));
const result = {
  source: 'Goodreads library export',
  exportedAt: new Date().toISOString().slice(0, 10),
  books,
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', 'utf8');
const readings = books.reduce((sum, book) => sum + book.readCount, 0);
const pages = books.reduce((sum, book) => sum + (book.pages || 0) * book.readCount, 0);
console.log(`${books.length} books, ${readings} readings, ${pages} registered pages; wrote ${output}`);

