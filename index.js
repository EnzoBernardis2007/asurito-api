// Configs
const express = require('express')
const cors = require('cors')
const jwt = require("jsonwebtoken")
const bodyParser = require("body-parser")

// my files
const db = require('./db')
const passwordManager = require('./password')
const getInfo = require('./getInfos')
const authenticate = require('./auth')

const app = express()
const SECRET_KEY = process.env.SECRET_KEY
const PORT = process.env.PORT

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

app.get('/getChampionships', authenticate, async (request, response) => {
    try {
        const championshipsList = await getInfo.getChampionships()

        response.status(200).json({
            championshipsList,
            message: 'Success'
        })
    } catch {
        response.status(500).json({
            message: 'Error when taking championship data'
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
            console.error("Error inserting athlete:", err)
            return response.status(500).json({ message: 'Error to insert athlete info', error: err })
        }

        return response.status(200).json({ message: 'Success' }) 
    })
})

app.post("/login", async (request, response) => {
    const { email, password } = request.body

    try {
        const query = 'SELECT * FROM athlete WHERE email = ?'

        db.query(query, [email], (err, results) => {
            if (results.length === 0) return response.status(400).json({ message: "Invalid info" })

            const user = results[0]

            const isPasswordValid = passwordManager.comparePassword(password, user.salt, user.password_hash)

            if (!isPasswordValid) return response.status(400).json({ message: "Invalid info" })

            const token = jwt.sign({ id: user.cpf, email: user.email }, SECRET_KEY, { expiresIn: "1h" })
            const cpf = user.cpf
            response.status(200).json({ token, cpf })
        })
    } catch (error) {
        response.status(500).json({ message: "Error in the server.", error: error.message })
    }
})

app.post('/inscription', authenticate, async (request, response) => {
    const { cpf, idChampionship } = request.body

    if (!cpf || !idChampionship) {
        return response.status(400).json({ message: 'Missing required fields' })
    }

    const query = 'INSERT INTO inscription VALUES(UUID(), ?, ?)'

    db.query(query, [cpf, idChampionship], (err, results) => {
        if (err) {
            return response.status(500).json({ message: 'Error to insert inscription'} )
        }

        return response.status(200).json({ message: 'Success' })
    })
})

app.get('/profile', authenticate, async (request, response) => {
    const { cpf } = request.query

    if (!cpf) {
        return response.status(400).json({ message: 'CPF is required' })
    }

    const query = `
    SELECT 
        athlete.email,
        athlete.password_hash,
        athlete.salt,
        athlete.cpf,
        athlete.full_legal_name,
        athlete.prefered_name,
        gender.ptbr_name AS gender_name,
        athlete.birthday,
        athlete.height,
        athlete.weight,
        athlete.sex,
        athlete.kyu,
        athlete.dan,
        athlete.dojo,
        athlete.city,
        athlete.wins,
        athlete.defeats
    FROM athlete
    JOIN gender
    ON athlete.gender_name = gender.name
    WHERE athlete.cpf = ?;
`;

    db.query(query, [cpf], (err, results) => {
        if (err) {
            return response.status(500).json({ message: 'Error to get athlete info' })
        }

        if (results.length === 0) {
            return response.status(404).json({ message: 'Athlete not found' })
        }

        const athlete = results[0]

        return response.status(200).json({ athlete })
    })
})


// Start message
app.listen(PORT, () => {
    console.log(`Rodando o servidor em http://localhost:${PORT}`)
})