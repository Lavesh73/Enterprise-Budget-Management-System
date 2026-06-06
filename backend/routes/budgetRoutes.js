const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const budgetsController = require('../controllers/budgetsController');

const router = express.Router();

router.route('/')
  .get(protect, budgetsController.getAll)
  .post(protect, budgetsController.create);

router.route('/:id')
  .put(protect, budgetsController.update)
  .delete(protect, budgetsController.delete);

module.exports = router;
