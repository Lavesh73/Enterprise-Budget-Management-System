const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const expendituresController = require('../controllers/expendituresController');

const router = express.Router();

router.route('/')
  .post(protect, expendituresController.addExpenditure);

router.route('/project/:projectId')
  .get(protect, expendituresController.getExpendituresByProject);

router.route('/:id')
  .delete(protect, expendituresController.deleteExpenditure);

module.exports = router;
