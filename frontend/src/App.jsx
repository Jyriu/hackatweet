import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
  useParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  CssBaseline,
  Tooltip,
  Avatar,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ChatIcon from "@mui/icons-material/Chat";
import SearchIcon from "@mui/icons-material/Search"; // Nouvelle icône loupe

// Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import Chat from "./pages/Chat";
import Search from "./pages/AdvancedSearchBar";

// Redux actions
import {
  connectToSocket,
  disconnectFromSocket,
} from "./redux/actions/socketActions";
import { loadUser, logoutUser } from "./redux/actions/userActions";
import { loadUnreadCount } from "./redux/actions/notificationActions";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// Composant pour les routes protégées
const ProtectedRoute = ({ element }) => {
  const user = useSelector((state) => state.user.currentUser);
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return element;
};

// Composant pour les routes d'authentification
const AuthRoute = ({ element }) => {
  const user = useSelector((state) => state.user.currentUser);
  if (user) {
    return <Navigate to="/" replace />;
  }
  return element;
};

// Composant pour les boutons de navigation
function NavigationButtons() {
  const user = useSelector((state) => state.user.currentUser);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const navigate = useNavigate();

  if (!user) return null;

  const iconButtonStyle = {
    fontSize: "1.5rem",
    transition: "transform 0.3s ease",
    "&:hover": { transform: "scale(1.1)" },
    color: "#001f3f", // Couleur sombre pour les boutons
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Tooltip title="Recherche">
        <IconButton
          onClick={() => navigate("/search")}
          sx={iconButtonStyle}
        >
          <SearchIcon fontSize="large" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Messages">
        <IconButton
          onClick={() => navigate("/chat")}
          sx={iconButtonStyle}
        >
          <ChatIcon fontSize="large" />
        </IconButton>
      </Tooltip>

      {user.notifOn && (
        <Tooltip title="Notifications">
          <IconButton
            onClick={() => navigate("/notifications")}
            sx={iconButtonStyle}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon fontSize="large" />
            </Badge>
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Profil">
        <IconButton
          onClick={() => navigate("/profile")}
          sx={iconButtonStyle}
        >
          <Avatar
            src={
              user.photo
                ? `${API_URL}${user.photo}`
                : "https://via.placeholder.com/150?text=Avatar"
            }
            alt={user.username}
            sx={{ width: 40, height: 40 }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// Bouton de déconnexion
function LogoutButton() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/auth");
  };

  return user ? (
    <Tooltip title="Déconnexion">
      <IconButton
        onClick={handleLogout}
        sx={{
          fontSize: "1.5rem",
          padding: "8px",
          transition: "transform 0.3s ease",
          "&:hover": { transform: "scale(1.1)" },
          color: "#001f3f",
        }}
      >
        <LogoutIcon fontSize="large" />
      </IconButton>
    </Tooltip>
  ) : null;
}

// Composant wrapper pour la page UserProfile
const UserProfileWrapper = () => {
  const { username } = useParams();
  const currentUser = useSelector((state) => state.user.currentUser);
  if (currentUser && currentUser.username === username) {
    return <Navigate to="/profile" replace />;
  }
  return <UserProfile />;
};

function AppContent() {
  const user = useSelector((state) => state.user.currentUser);

  return (
    <>
      {user && (
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            color: "#545f69",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 1200,
            transition: "background-color 0.3s ease",
          }}
        >
          <Toolbar>
            <Typography
              component={Link}
              to="/"
              sx={{
                fontSize: "2rem",
                flexGrow: 1,
                fontWeight: "bold",
                color: "#75B7B0", // Couleur rappelant le fond d'auth
                fontFamily: "'Montserrat', sans-serif", // Police adaptée pour un logo
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              HackaTweet
            </Typography>
            <NavigationButtons />
            <Tooltip title="Paramètres">
              <IconButton
                component={Link}
                to="/settings"
                sx={{
                  fontSize: "1.5rem",
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.1)" },
                  color: "#001f3f",
                }}
              >
                <SettingsIcon fontSize="large" />
              </IconButton>
            </Tooltip>
            <LogoutButton />
          </Toolbar>
        </AppBar>
      )}

      <Box sx={{ paddingTop: user ? "64px" : 0 }}>
        <Routes>
          <Route path="/" element={<ProtectedRoute element={<Home />} />} />
          <Route path="/search" element={<ProtectedRoute element={<Search />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/auth" element={<AuthRoute element={<Auth />} />} />
          <Route
            path="/notifications"
            element={<ProtectedRoute element={<Notifications />} />}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute element={<Settings />} />}
          />
          <Route
            path="/chat"
            element={<ProtectedRoute element={<Chat />} />}
          />
          <Route
            path="/user/:username"
            element={<ProtectedRoute element={<UserProfileWrapper />} />}
          />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />
          <Route
            path="*"
            element={<Navigate to={user ? "/" : "/auth"} replace />}
          />
        </Routes>
      </Box>
    </>
  );
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const socketConnected = useSelector(state => state.socket.connected);
  const token = useSelector(state => state.user.token);

  // Connecter l'utilisateur au démarrage de l'application
  useEffect(() => {
    if (token) {
      console.log('🔄 Chargement des informations utilisateur avec token:', token.substring(0, 15) + '...');
      dispatch(loadUser());
    } else {
      console.log('⚠️ Aucun token disponible, impossible de charger l\'utilisateur');
    }
  }, [dispatch, token]);

  // Connecter le socket quand l'utilisateur est authentifié
  useEffect(() => {
    if (user && !socketConnected) {
      console.log('🔌 Connexion au WebSocket pour l\'utilisateur:', user._id);
      dispatch(connectToSocket());
    } else if (!user && socketConnected) {
      console.log('🔌 Déconnexion du WebSocket (utilisateur déconnecté)');
      dispatch(disconnectFromSocket());
    }
  }, [user, socketConnected, dispatch]);

  // Charger le nombre de notifications non lues quand l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      console.log('🔔 Chargement des notifications pour l\'utilisateur:', user._id);
      dispatch(loadUnreadCount());
    }
  }, [user, dispatch]);

  return (
    <Router>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          // background: "linear-gradient(135deg, #FF6B6B, #4ECDC4)",
          transition: "background 0.5s ease",
        }}
      >
          <AppContent />
      </Router>
      </Box>
  );
}

export default App;
