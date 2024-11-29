const db = require('./db')

const getGenders = async () => {
    const query = 'SELECT * FROM gender'

    return new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error picking up genders:', err)
                reject(err) 
            } else {
                resolve(results) 
            }
        })
    })
}

const getChampionships = async () => {
    const query = 'SELECT * FROM championship WHERE accepting_athletes = true'

    return new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if(err) {
                console.log('Error picking up championships', err)
                reject(err)
            } else {
                resolve(results)
            }
        })
    })
}

module.exports = { getGenders, getChampionships }