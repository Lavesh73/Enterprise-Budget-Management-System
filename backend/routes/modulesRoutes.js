const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const modulesController = require('../controllers/modulesController');

const router = express.Router();

router.route('/:module')
  .get(protect, modulesController.getAll)
  .post(protect, modulesController.create);

router.route('/:module/:id')
  .put(protect, modulesController.update)
  .delete(protect, modulesController.delete);

module.exports = router;
