import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Badge, 
  Box, 
  CssBaseline 
} from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';

// Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";

// Redux actions
import { connectToSocket, disconnectFromSocket } from './redux/actions/socketActions';
import { loadUser, logoutUser } from './redux/actions/userActions';

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
    navigate('/login');
  };

  return user ? (
    <Button color="error" onClick={handleLogout}>
      Déconnexion
    </Button>
  ) : null;
}

// Composant d'application principale qui utilise les composants de navigation
function AppContent() {
  return (
    <>
      {/* Barre de navigation */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HackaTweet
          </Typography>
          <NavigationButtons />
          <LogoutButton />
        </Toolbar>
      </AppBar>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notifications" element={<Notifications />} />
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