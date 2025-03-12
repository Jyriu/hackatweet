const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Utilisé pour vérifier/créer le dossier
const userController = require("../controllers/userController");
const { auth } = require("../middleware/authMiddleware");

// Vérifier que le dossier "uploads/" existe, sinon le créer automatiquement
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Utilise le dossier assuré d'exister
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Routes pour le profil utilisateur
router.get("/profile/:username", userController.getUserByUsername);
router.put(
  "/profile",
  auth,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  userController.updateProfile
);

// Routes pour follow/unfollow
router.post("/follow/:userToFollowId", auth, userController.followUser);
router.post("/unfollow/:userToUnfollowId", auth, userController.unfollowUser);

// Routes pour obtenir les abonnés et abonnements
router.get("/:username/followers", userController.getFollowers);
router.get("/:username/following", userController.getFollowing);

// Route pour mettre à jour les mots-clés et hashtags depuis l'IA
router.post('/update-keywords', auth, userController.updateKeywordsFromAI);

// Route pour obtenir les utilisateurs suggérés
router.get('/suggested-users', auth, userController.getSuggestedUsers);

// Route générique pour basculer les paramètres utilisateur (camera, notifications, etc.)
router.put('/toggle/:setting', auth, userController.toggleUserSetting);
// Route utilisées dans la création d'un tweet
router.get("/api/users/search",auth, userController.searchUsers);
router.get("/api/users/by-username/:username",auth, userController.getUserByUsername);
module.exports = router;
