const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const publicKey = fs.readFileSync(path.join(__dirname, '../keys/publicKey.pem'), 'utf8');

const verifyToken = (req, res, next) => {
    if (req.path === '/metrics') {
        return next();
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

    try {
        const verified = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        req.user = verified;

        // استخراج الـ Roles (تأكدي واش سميتهم scope ولا roles فـ الـ Token اللي جاي من Java)
        const roles = verified.scope || verified.roles || "";

        // دابا زدنا LIVREUR باش يقدر يقرأ الزونات
        if (roles.includes('ADMIN') || roles.includes('DISPATCHER') || roles.includes('LIVREUR')) {
            next();
        } else {
            // إيلا كان شي مستعمل آخر (مثلاً Client) وبغى يدخل غايعطيه 403
            res.status(403).json({ message: "Forbidden: You don't have permission" });
        }
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

module.exports = verifyToken;