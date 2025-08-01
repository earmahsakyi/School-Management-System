

module.exports = (req, res, next) => {
    
    const secretKey = (req.body.secretKey || req.query.secretKey || '').trim();


    if (!secretKey || secretKey !== process.env.secretKey) {
        return res.status(401).json({ message: "Invalid or missing secret key." });
    }

    next();
};