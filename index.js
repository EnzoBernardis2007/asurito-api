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

// Start message
const PORT = 3000

app.listen(PORT, () => {
    console.log(`Rodando o servidor em http://localhost:${PORT}`)
})