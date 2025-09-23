const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.end('O tasso é bom mesmo!');
});

server.listen(PORT, () => {
  console.log(`Vamos ver se o tasso é bom mesmo!`);
});