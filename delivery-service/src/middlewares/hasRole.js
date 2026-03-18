module.exports = (role) => {
    return (req, res, next) => {
        // كنشوفو واش الـ Role اللي جاي فالـ Token هو اللي باغيين
        if (!req.user.authorities || !req.user.authorities.includes(role)) {
            return res.status(403).json({ message: "Accès refusé: Role insuffisant" });
        }
        next();
    };
};