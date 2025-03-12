import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import { useContext } from "react";
import { UserContext } from "./context/UserContext";
import { Button, AppBar, Toolbar, Typography, IconButton, Tooltip } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import UserProfile from "./pages/UserProfile";

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

          <Tooltip title="Paramètres">
            <IconButton color="inherit" component={Link} to="/settings">
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <LogoutButton />
        </Toolbar>
      </AppBar>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/user/:username" element={<UserProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
