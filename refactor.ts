import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Replace product image properties but be careful with html 'image' generic usages
  // The user said: "thống nhất sử dụng duy nhất một tên trường là "picture""
  // So we replace:
  // image: string; -> picture: string;
  // images?: string[]; -> pictures?: string[];
  // .image -> .picture
  // .images -> .pictures
  // image} -> picture}
  // image= -> picture=
  // image, -> picture,
  // image: -> picture:
  
  if (filePath.endsWith('types.ts')) {
    content = content.replace(/image: string/g, 'picture: string');
    content = content.replace(/images\?: string\[\]/g, 'pictures?: string[]');
  } else if (filePath.endsWith('server.ts')) {
    content = content.replace(/image:/g, 'picture:');
    content = content.replace(/images:/g, 'pictures:');
    content = content.replace(/fallbackImage/g, 'fallbackPicture');
    content = content.replace(/finalImage/g, 'finalPicture');
    content = content.replace(/image(?:s)?(,| |\})/g, match => match.replace('image', 'picture'));
    content = content.replace(/\.image/g, '.picture');
    content = content.replace(/\.images/g, '.pictures');
  } else {
    // For components
    content = content.replace(/\.image/g, '.picture');
    content = content.replace(/\.images/g, '.pictures');
    content = content.replace(/({|\s)image(\s|}|,|:)/g, (match, p1, p2) => `${p1}picture${p2}`);
    content = content.replace(/({|\s)images(\s|}|,|:)/g, (match, p1, p2) => `${p1}pictures${p2}`);
    // Replace <img src={...picture} /> check
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const files = [
  'src/types.ts',
  'server.ts',
  'src/App.tsx',
  'src/utils.ts',
  'src/components/ProductCard.tsx',
  'src/components/Cart.tsx',
  'src/components/ProductDetail.tsx',
  'src/components/CategoryGrid.tsx',
  'src/components/Header.tsx',
  'src/components/AdminPanel.tsx'
];

files.forEach(replaceInFile);
