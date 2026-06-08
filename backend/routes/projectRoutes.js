const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const projectsController = require('../controllers/projectsController');

const router = express.Router();

router.route('/')
  .get(protect, projectsController.getAll)
  .post(protect, projectsController.create);

router.route('/:id/assign-group')
  .put(protect, projectsController.assignGroup);

router.route('/:id/details')
  .get(protect, projectsController.getProjectDetails);

router.route('/:id/forecast')
  .get(protect, projectsController.getProjectForecast);

router.route('/:id/assign-head')
  .put(protect, projectsController.setProjectHead);

router.route('/:id/start')
  .put(protect, projectsController.startProject);

module.exports = router;
