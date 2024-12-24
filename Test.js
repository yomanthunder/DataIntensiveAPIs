const path = require('path');
const fs = require('fs');
const { write } = require('@fast-csv/format');

const rows = [
    {
        a: "a2",
        b: "b2",
        c: "c2",
    },
];

const filePath = path.resolve(__dirname, 'tmp.csv');

// Check if the file exists to decide whether to write headers
const fileExists = fs.existsSync(filePath);

// Create a writable stream in append mode
const stream = fs.createWriteStream(filePath, { flags: 'a' });

write(rows, { headers: !fileExists, includeEndRowDelimiter: true }) // Write headers only if the file doesn't exist
    .pipe(stream)
    .on('error', err => console.error(err))
    .on('finish', () => console.log('Done writing.'));
    console.log(`videoId successfully fetched`);