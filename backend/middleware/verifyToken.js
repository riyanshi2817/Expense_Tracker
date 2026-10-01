const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;
