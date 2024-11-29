// Configs
const express = require('express')
const cors = require('cors')
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// my files
const db = require('./db')
const passwordManager = require('./password')
const getInfo = require('./getInfos');
const authenticate = require('./auth');

const app = express()
const SECRET_KEY = process.env.SECRET_KEY;
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

app.get('/getChampionships', async (request, response) => {
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
            console.error("Error inserting athlete:", err);
            return response.status(500).json({ message: 'Error to insert athlete info', error: err });
        }

        return response.status(200).json({ message: 'Success' }) 
    })
})

app.post("/login", async (request, response) => {
    const { email, password } = request.body;

    try {
        const query = 'SELECT * FROM athlete WHERE email = ?'

        db.query(query, [email], (err, results) => {
            if (results.length === 0) return response.status(400).json({ message: "Invalid info" });

            const user = results[0];

            const isPasswordValid = passwordManager.comparePassword(password, user.salt, user.password_hash)

            if (!isPasswordValid) return response.status(400).json({ message: "Invalid info" });

            const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
            response.status(200).json({ token });
        })
    } catch (error) {
        response.status(500).json({ message: "Error in the server.", error: error.message });
    }
});

// Start message
app.listen(PORT, () => {
    console.log(`Rodando o servidor em http://localhost:${PORT}`)
})