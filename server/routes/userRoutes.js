const express = require('express');

const verifyToken = require('../middleware/verifyToken');
const {
  getCurrentUser,
  updateCurrentUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(verifyToken);

router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);

module.exports = router;

