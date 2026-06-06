const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const projectsController = require('../controllers/projectsController');

const router = express.Router();

router.route('/')
  .get(protect, projectsController.getAll)
  .post(protect, projectsController.create);

router.route('/:id/assign-group')
  .put(protect, projectsController.assignGroup);

module.exports = router;
