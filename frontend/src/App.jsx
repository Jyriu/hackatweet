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
import Search from "./pages/AdvancedSearchBar"

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

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

<Tooltip title="Messages">
        <IconButton
          color="inherit"
          onClick={() => navigate("/search")}
          sx={{ fontSize: "1.5rem" }}
        >
          Search
        </IconButton>
      </Tooltip>
      <Tooltip title="Messages">
        <IconButton
          color="inherit"
          onClick={() => navigate("/chat")}
          sx={{ fontSize: "1.5rem" }}
        >
          <ChatIcon fontSize="large" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={() => navigate("/notifications")}
          sx={{ fontSize: "1.5rem" }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon fontSize="large" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Tooltip title="Profile">
        <IconButton
          color="inherit"
          onClick={() => navigate("/profile")}
          sx={{ fontSize: "1.5rem" }}
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
        }}
      >
        <LogoutIcon fontSize="large" />
      </IconButton>
    </Tooltip>
  ) : null;
}

// Composant wrapper pour la page UserProfile
// Si le pseudo dans l'URL correspond à celui de l'utilisateur connecté,
// redirige vers la page /profile
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
            backgroundColor: "#f5f8fa",
            color: "#545f69",
            boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.1)",
            zIndex: 1200,
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
                color: "primary.main",
                fontFamily: "'Poppins', sans-serif",
                textDecoration: "none",
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "none",
                },
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
                sx={{ fontSize: "1.5rem" }}
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
          <Route path="/search" element={<ProtectedRoute element={<Search/>} />} />

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

const App = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);
  const isConnected = useSelector((state) => state.socket.connected);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(loadUnreadCount());
      if (!isConnected) {
        dispatch(connectToSocket());
      }
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
