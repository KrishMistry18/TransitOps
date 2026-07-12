const express = require('express');
const { getSettings, updateSettings, getPermissions } = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, requireRole('FLEET_MANAGER'), updateSettings);
router.get('/permissions', authenticate, getPermissions);

module.exports = router;
