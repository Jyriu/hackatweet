import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import { useContext } from "react";
import { UserContext } from "./context/UserContext";
import { NotificationContext } from "./context/NotificationContext";
import { Button, AppBar, Toolbar, Typography, IconButton, Badge, Box } from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from "react-router-dom";

function NavigationButtons() {
  const { user } = useContext(UserContext);
  const { unreadCount } = useContext(NotificationContext);
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

function LogoutButton() {
  const { user, setUser } = useContext(UserContext);

  return user ? (
    <Button color="error" onClick={() => setUser(null)}>
      Déconnexion
    </Button>
  ) : null;
}

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
