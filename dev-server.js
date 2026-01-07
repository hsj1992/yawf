const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const FILE = 'Yet_Another_Weibo_Filter.user.js';

http.createServer((req, res) => {
  if (req.url === '/' + FILE) {
    const filePath = path.join(__dirname, FILE);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}/${FILE}`);
});
