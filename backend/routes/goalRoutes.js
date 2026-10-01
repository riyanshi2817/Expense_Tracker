const express = require('express');

const verifyToken = require('../middleware/verifyToken');
const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalController');

const router = express.Router();

// Every goal endpoint requires a valid JWT.
router.use(verifyToken);

router.post('/', createGoal);
router.get('/', getGoals);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;

