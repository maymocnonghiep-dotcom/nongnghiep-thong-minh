import http from 'http';
const postData = JSON.stringify({
  sku: "TEST-01",
  name: "Test item",
  category: "Test category",
  price: 100,
  image: "https://test.image"
});
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.write(postData);
req.end();
