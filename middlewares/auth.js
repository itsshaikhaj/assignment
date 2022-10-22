const jwt = require('jsonwebtoken');
TOKEN_KEY = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.send('An authorization token is required to proceed further!');
    }

    try {
        const decoded = jwt.verify(token, TOKEN_KEY);
        req.user = decoded;

    } catch (error) {
        return res.status(400).send('Invalid TOKEN!!!');
    }

    return next();
};

module.exports = verifyToken