const bcrypt = require('bcrypt');
const env = require('../config/env');

function hashPassword(password) {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword
};
