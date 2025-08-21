import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// my files
import db from "./db.js";
import * as passwordManager from "./password.js";
import * as getInfo from "./getInfos.js";
import authenticate from "./auth.js";

const app = express()
const SECRET_KEY = process.env.SECRET_KEY
const PORT = process.env.PORT

app.use(express.json())
app.use(cors())

app.get('/genders', async (request, response) => {
    try {
        const gendersList = await getInfo.getGenders()

        response.status(200).json({
            ...gendersList
        })
    } catch {
        response.status(500).json({
            message: 'Error when taking gender data'
        })
    }
})

app.get('/brackets/:championship_id', async (request, response) => {
    const { championship_id } = request.params

    if(!championship_id) {
        return response.status(400).json({ error: "No championship id provided" })
    }

    const query = 'CALL GetBracketsDetailsByChampionship(?)'

    db.query(query, [championship_id], (err, results) => {
        if (err) {
            console.error("Error fetching brackets:", err)
            return response.status(500).json({ message: 'Error fetching brackets', error: err })
        }

        if(results[0] == {}) {
            return response.status(400).json({ message: "No championship associated with this ID"})
        }

        return response.status(200).json({ ...results[0] })
    })
})

app.get('/championships', async (request, response) => {
    try {
        const championshipsList = await getInfo.getChampionships()

        response.status(200).json({
            ...championshipsList
        })
    } catch {
        response.status(500).json({
            message: 'Error when taking championship data'
        })
    }
})

app.post("/athlete", (request, response) => {
  try {
    const {
      email,
      password,
      cpf,
      fullName,
      socialName,
      gender,
      birthday,
      height,
      weight,
      sex,
      kyu,
      dan,
      dojo,
      city,
    } = request.body

    // gera uuid
    const id = uuidv4()

    // gera hash da senha
    const { salt, hash } = passwordManager.hashPasswordWithSalt(password)

    // TODO: aqui você precisa criptografar o CPF
    const encryptedCpf = passwordManager.encryptCPF(cpf) 

    const values = [
      id,
      email,
      hash,
      salt,
      encryptedCpf,
      fullName,
      socialName || null,
      gender,
      birthday,
      parseFloat(height),
      parseInt(weight, 10),
      sex,
      parseInt(kyu, 10),
      parseInt(dan, 10),
      dojo,
      city,
      0, // wins inicial
      0, // defeats inicial
    ]

    const query = `
      INSERT INTO athlete (
        id,
        email, 
        password_hash, 
        salt, 
        encrypted_cpf, 
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
        city,
        wins,
        defeats
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    db.query(query, values, (err, results) => {
      if (err) {
        console.error("Error inserting athlete:", err)
        return response.status(500).json({
          message: "Error to insert athlete info",
          error: err,
          insert: false,
        })
      }

      return response
        .status(201)
        .json({ message: "Success", insert: true, id })
    })
  } catch (err) {
    console.error(err)
    return response.status(500).json({ message: "Unexpected error", insert: false })
  }
})


app.post("/login", async (request, response) => {
    const { email, password } = request.body

    try {
        const query = 'SELECT * FROM athlete WHERE email = ?'

        db.query(query, [email], (err, results) => {
            if (results.length === 0) return response.status(400).json({ message: "No account is associated with this email" })

            const user = results[0]
            const isPasswordValid = passwordManager.comparePassword(password, user.salt, user.password_hash)

            if (!isPasswordValid) return response.status(400).json({ message: "Invalid password" })

            const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" })
            return response.status(200).json({ token, id: user.id })
        })
    } catch (error) {
        response.status(500).json({ message: "Error in the backend.", error: error.message })
    }
})

app.post('/inscription', authenticate, async (request, response) => {
    const { userId, idChampionship } = request.body

    if (!userId || !idChampionship) {
        return response.status(400).json({ message: 'Missing required fields' })
    }

    const query = 'INSERT INTO inscription VALUES(UUID(), ?, ?)'
    db.query(query, [userId, idChampionship], (err) => {
        if (err) {
            return response.status(500).json({ message: 'Error to insert inscription', insert: false })
        }

        return response.status(200).json({ message: 'Success', insert: true })
    })
})

app.get("/athlete", authenticate, (req, res) => {
  const id = req.query.id || req.user?.id

  if (!id) {
    return res.status(400).json({ message: "ID is required" })
  }

  const query = `
    SELECT 
      athlete.id,
      athlete.email,
      athlete.password_hash,
      athlete.salt,
      athlete.encrypted_cpf,
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
    WHERE athlete.id = ?
  `

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ message: "Error to get athlete info" })
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Athlete not found" })
    }

    const athlete = results[0]

    try {
      athlete.cpf = passwordManager.decryptCPF(athlete.encrypted_cpf)
      delete athlete.encrypted_cpf
    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: "Error decrypting CPF" })
    }

    return res.status(200).json({ athlete })
  })
})


app.listen(PORT, () => {
    console.log(`Rodando o servidor em http://localhost:${PORT}`)
})