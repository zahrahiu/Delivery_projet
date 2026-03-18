const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// قراءة الـ Public Key
const publicKey = fs.readFileSync(path.join(__dirname, '../keys/publicKey.pem'), 'utf8');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // كياخد التوكن من "Bearer TOKEN"

    if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

    try {
        // فحص التوكن باستعمال الـ RSA Public Key
        const verified = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        req.user = verified; // كيخزن معلومات المستعمل (Roles, Username)

        // التحقق من الـ Role (Admin أو Dispatcher فقط)
        const roles = verified.scope || verified.roles || ""; // على حسب شنو سميتيهم فـ Java
        if (roles.includes('ADMIN') || roles.includes('DISPATCHER')) {
            next(); // مسموح ليه يدوز
        } else {
            res.status(403).json({ message: "Forbidden: You don't have permission" });
        }
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

module.exports = verifyToken;