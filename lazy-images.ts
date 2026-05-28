import fs from 'fs';

function replaceInFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add loading="lazy" to all <img tags that don't have it
  content = content.replace(/<img\s([^>]+)>/ig, (match, p1) => {
    if (!match.includes('loading=')) {
      return `<img loading="lazy" ${p1}>`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const files = [
  'src/components/ProductCard.tsx',
  'src/components/Cart.tsx',
  'src/components/ProductDetail.tsx',
  'src/components/CategoryGrid.tsx',
  'src/components/Header.tsx',
  'src/components/AdminPanel.tsx',
  'src/components/Promotions.tsx',
  'src/components/Customers.tsx',
  'src/components/NewsSection.tsx'
];

files.forEach(replaceInFile);
