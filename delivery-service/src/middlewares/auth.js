const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// كنقراو الـ Public Key اللي ديجا عندك (نفسو اللي فـ Java)
const publicKey = fs.readFileSync(
    path.join(__dirname, "../keys/publicKey.pem"), // تأكدي من المسار
    "utf8"
);

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token manquant" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // التحقق باستعمال RS256 (RSA)
        const decoded = jwt.verify(token, publicKey, {
            algorithms: ["RS256"]
        });

        // هنا كنخبيو معلومات المستخدم (id, roles...) وسط req باش نخدمو بيهم من بعد
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token invalide" });
    }
};

module.exports = authMiddleware;