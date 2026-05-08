const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const publicKey = fs.readFileSync(path.join(__dirname, '../keys/publicKey.pem'), 'utf8');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No Token, Access Denied" });

    try {
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        req.user = decoded;

        if (req.user.roles && typeof req.user.roles === 'string') {
            req.user.roles = req.user.roles.split(' ');
        }

        if (req.user.authorities && typeof req.user.authorities === 'string') {
            req.user.authorities = req.user.authorities.split(' ');
        }

        next();
    } catch (err) {
        res.status(401).json({ message: "Token non valide" });
    }
};