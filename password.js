const crypto = require('crypto');

function hashPasswordWithSalt(password) {
    const salt = crypto.randomBytes(16).toString('hex'); 
  
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex'); 
  
    return { salt, hash };
}

module.exports = { hashPasswordWithSalt };
