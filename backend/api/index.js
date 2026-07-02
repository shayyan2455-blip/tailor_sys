const app = require('../src/app');

module.exports = (req, res) => {
  // Log the incoming request for debugging
  console.log('Incoming request:', req.url, req.method);
  
  // Prepend /api to the path since Vercel strips it
  const originalUrl = req.url;
  req.url = '/api' + (originalUrl === '/' ? '/v1' : originalUrl);
  
  console.log('Modified request URL:', req.url);
  
  // Handle the request with Express
  app(req, res);
};
