const crypto = require('crypto');

function hashPasswordWithSalt(password) {
    const salt = crypto.randomBytes(16).toString('hex'); 
  
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex'); 
  
    return { salt, hash };
}

function comparePassword(password, salt, storedHash) {
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');

    return hash === storedHash;
}


module.exports = { hashPasswordWithSalt, comparePassword };
