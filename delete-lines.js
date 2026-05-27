import fs from 'fs';
const lines = fs.readFileSync('server.ts', 'utf-8').split('\n');
const newLines = [...lines.slice(0, 31), ...lines.slice(900)];
fs.writeFileSync('server.ts', newLines.join('\n'));
