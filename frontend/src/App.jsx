import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  CssBaseline,
  Tooltip,
  Avatar,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";

// Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";

// Redux actions
import {
  connectToSocket,
  disconnectFromSocket,
} from "./redux/actions/socketActions";
import { loadUser, logoutUser } from "./redux/actions/userActions";

// Composant pour les routes protégées
const ProtectedRoute = ({ element }) => {
  const user = useSelector((state) => state.user.currentUser);

  // Si l'utilisateur n'est pas connecté, rediriger vers la page d'authentification
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Sinon, rendre le composant demandé
  return element;
};

// Composant pour les routes d'authentification
const AuthRoute = ({ element }) => {
  const user = useSelector((state) => state.user.currentUser);

  // Si l'utilisateur est déjà connecté, rediriger vers la page d'accueil
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Sinon, rendre le composant demandé
  return element;
};

// Composant de navigation avec Redux (défini à l'intérieur du Router)
function NavigationButtons() {
  const user = useSelector((state) => state.user.currentUser);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Tooltip title="Home">
        <IconButton
          color="inherit"
          onClick={() => navigate("/")}
          sx={{ fontSize: "1.5rem" }} // Increase icon size
        >
          <HomeIcon fontSize="large" /> {/* Increase icon size */}
        </IconButton>
      </Tooltip>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={() => navigate("/notifications")}
          sx={{ fontSize: "1.5rem" }} // Increase icon size
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon fontSize="large" /> {/* Increase icon size */}
          </Badge>
        </IconButton>
      </Tooltip>
      <Tooltip title="Profile">
        <IconButton
          color="inherit"
          onClick={() => navigate("/profile")}
          sx={{ fontSize: "1.5rem" }} // Increase icon size
        >
          <Avatar
            src={user.profilePicture}
            alt={user.username}
            sx={{ width: 40, height: 40 }} // Increase avatar size
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// Bouton de déconnexion avec Redux (défini à l'intérieur du Router)
function LogoutButton() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/auth");
  };

  return user ? (
    <Button
      color=""
      onClick={handleLogout}
      sx={{
        textTransform: "none",
        fontWeight: "bold",
        fontSize: "1.5rem", // Increase button text size
        padding: "8px 16px", // Increase button padding
      }}
    >
      Déconnexion
    </Button>
  ) : null;
}

// Composant d'application principale qui utilise les composants de navigation
function AppContent() {
  const user = useSelector((state) => state.user.currentUser);

  return (
    <>
      {/* Barre de navigation - visible uniquement si l'utilisateur est connecté */}
      {user && (
        <AppBar
          position="fixed" // Fix the navbar at the top
          sx={{
            backgroundColor: "#f5f8fa",
            color: "#545f69",
            boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.1)",
            zIndex: 1200, // Ensure the navbar is above other content
          }}
        >
          <Toolbar>
            <Typography
              sx={{
                fontSize: "2rem",
                flexGrow: 1,
                fontWeight: "bold",
                color: "primary.main",
                fontFamily: "'Poppins', sans-serif", // Use Arial as the font
              }}
            >
              HackaTweet
            </Typography>
            <NavigationButtons />
            <Tooltip title="Paramètres">
              <IconButton
                color="inherit"
                component={Link}
                to="/settings"
                sx={{ fontSize: "1.5rem" }} // Increase icon size
              >
                <SettingsIcon fontSize="large" /> {/* Increase icon size */}
              </IconButton>
            </Tooltip>
            <LogoutButton />
          </Toolbar>
        </AppBar>
      )}

      {/* Add padding to the main content to avoid overlap with the fixed navbar */}
      <Box sx={{ paddingTop: user ? "64px" : 0 }}>
        <Routes>
          <Route path="/" element={<ProtectedRoute element={<Home />} />} />
          <Route
            path="/profile"
            element={<ProtectedRoute element={<Profile />} />}
          />
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
            path="/user/:username"
            element={<ProtectedRoute element={<UserProfile />} />}
          />

          {/* Redirection des anciennes routes vers /auth */}
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />

          {/* Redirection par défaut */}
          <Route
            path="*"
            element={<Navigate to={user ? "/" : "/auth"} replace />}
          />
        </Routes>
      </Box>
    </>
  );
}

const App = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);
  const isConnected = useSelector((state) => state.socket.connected);

  // Charger l'utilisateur au démarrage de l'application
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Connecter au WebSocket lorsque l'utilisateur est authentifié
  useEffect(() => {
    if (user && !isConnected) {
      dispatch(connectToSocket());
    }

    return () => {
      if (isConnected) {
        dispatch(disconnectFromSocket());
      }
    };
  }, [user, isConnected, dispatch]);

  return (
    <>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </>
  );
};

export default App;
