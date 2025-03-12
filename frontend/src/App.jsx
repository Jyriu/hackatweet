import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
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
} from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';

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
import { connectToSocket, disconnectFromSocket } from './redux/actions/socketActions';
import { loadUser, logoutUser } from './redux/actions/userActions';

// Composant pour les routes protégées
const ProtectedRoute = ({ element }) => {
  const user = useSelector(state => state.user.currentUser);

  // Si l'utilisateur n'est pas connecté, rediriger vers la page d'authentification
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Sinon, rendre le composant demandé
  return element;
};

// Composant pour les routes d'authentification
const AuthRoute = ({ element }) => {
  const user = useSelector(state => state.user.currentUser);

  // Si l'utilisateur est déjà connecté, rediriger vers la page d'accueil
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Sinon, rendre le composant demandé
  return element;
};

// Composant de navigation avec Redux (défini à l'intérieur du Router)
function NavigationButtons() {
  const user = useSelector(state => state.user.currentUser);
  const unreadCount = useSelector(state => state.notifications.unreadCount);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex' }}>
      <IconButton color="inherit" onClick={() => navigate('/')}>
        <HomeIcon />
      </IconButton>
      <IconButton color="inherit" onClick={() => navigate('/notifications')}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Box>
  );
}

// Bouton de déconnexion avec Redux (défini à l'intérieur du Router)
function LogoutButton() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/auth');
  };

  return user ? (
    <Button color="error" onClick={handleLogout}>
      Déconnexion
    </Button>
  ) : null;
}

// Composant d'application principale qui utilise les composants de navigation
function AppContent() {
  const user = useSelector(state => state.user.currentUser);

  return (
    <>
      {/* Barre de navigation - visible uniquement si l'utilisateur est connecté */}
      {user && (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              HackaTweet
            </Typography>
            <NavigationButtons />
            <Tooltip title="Paramètres">
              <IconButton color="inherit" component={Link} to="/settings">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <LogoutButton />
          </Toolbar>
        </AppBar>
      )}

      <Routes>
        <Route path="/" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
        <Route path="/auth" element={<AuthRoute element={<Auth />} />} />
        <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
        <Route path="/user/:username" element={<ProtectedRoute element={<UserProfile />} />} />

        {/* Redirection des anciennes routes vers /auth */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
      </Routes>
    </>
  );
}

const App = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const isConnected = useSelector(state => state.socket.connected);

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