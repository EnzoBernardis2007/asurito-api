// Configs
const express = require('express')
const cors = require('cors')

// my files
const db = require('./db')
const passwordManager = require('./password')
const getInfo = require('./getInfos')

const app = express()

app.use(express.json())
app.use(cors())

app.get('/getGenders', async (request, response) => {
    try {
        const gendersList = await getInfo.getGenders()

        response.status(200).json({
            gendersList,
            message: 'Success'
        })
    } catch {
        response.status(500).json({
            message: 'Error when taking gender data'
        })
    }
})

app.post('/postNewAthlete', (request, response) => {
    const { email,
        password,
        cpf,
        fullName,
        socialName,
        gender,
        birthDate,
        height,
        weight,
        sex,
        kyu,
        dan,
        dojo,
        city } = request.body

    const { salt, hash } = passwordManager.hashPasswordWithSalt(password)

    const values = [email, hash, salt, cpf, fullName, socialName, gender, birthDate,
        height, weight, sex, kyu, dan, dojo, city 
    ]
    
    const query = `
    INSERT INTO athlete (
        email, 
        password_hash, 
        salt, 
        cpf, 
        full_legal_name, 
        prefered_name, 
        gender_name, 
        birthday, 
        height, 
        weight, 
        sex, 
        kyu, 
        dan, 
        dojo, 
        city
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    
    db.query(query, values, (err, results) => {
        if (err) {
            console.error("Error inserting athlete:", err);
            return response.status(500).json({ message: 'Error to insert athlete info', error: err });
        }

        return response.status(200).json({ message: 'Success' }) 
    })
})


// Start message
const PORT = 3000

app.listen(PORT, () => {
    console.log(`Rodando o servidor em http://localhost:${PORT}`)
})