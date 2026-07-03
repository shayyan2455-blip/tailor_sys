const createApp = require('../backend/src/app');
let appInstance = null;

async function getApp() {
  if (!appInstance) {
    appInstance = await createApp();
  }
  return appInstance;
}

module.exports = async (req, res) => {
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url === '/' ? '' : req.url}`;
  }

  const app = await getApp();
  return app(req, res);
};
