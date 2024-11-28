const db = require('./db')

const getGenders = async () => {
    const query = 'SELECT name FROM gender'

    return new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if (err) {
                console.error('Erro ao pegar gêneros:', err)
                reject(err) 
            } else {
                resolve(results) 
            }
        })
    })
}

module.exports = { getGenders }