import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import { useContext } from "react";
import { UserContext } from "./context/UserContext";
import { Button, AppBar, Toolbar, Typography } from "@mui/material";

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
          <LogoutButton />
        </Toolbar>
      </AppBar>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
