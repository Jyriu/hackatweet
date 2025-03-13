const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { auth } = require('../middleware/authMiddleware');

// Route pour la recherche d'utilisateurs
router.get('/users', auth, searchController.searchUsers);

// Route pour la recherche avancée
router.post('/advancedSearch', auth, searchController.advancedSearch);

module.exports = router;
