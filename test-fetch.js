import http from 'http';
http.get('http://localhost:3000/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const products = JSON.parse(data);
    console.log("Total items:", products.length);
    console.log("Has TEST-01?", products.some(p => p.sku === "TEST-01"));
  });
});
