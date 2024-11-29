const jwt = require("jsonwebtoken")
require("dotenv").config()

const SECRET_KEY = process.env.SECRET_KEY

if (!SECRET_KEY) {
    throw new Error("SECRET_KEY is not defined in the environment variables.")
}

const authenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header not provided." })
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
        return res.status(401).json({ message: "Token not provided in the authorization header." })
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." })
        }

        req.user = user 
        next() 
    })
}

module.exports = authenticate
