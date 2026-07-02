const app = require('../src/app');

module.exports = (req, res) => {
  // Log the incoming request for debugging
  console.log('Incoming request:', req.url, req.method);
  
  // Handle the request with Express
  app(req, res);
};
