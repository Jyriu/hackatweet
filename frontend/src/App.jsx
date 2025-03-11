// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   useNavigate,
//   Link,
// } from "react-router-dom";
// import Home from "./pages/Home";
// import Profile from "./pages/Profile";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import { useContext } from "react";
// import { UserContext, UserProvider } from "./context/UserContext"; // Assurez-vous d'exporter UserProvider dans UserContext.jsx
// import { Button, AppBar, Toolbar, Typography } from "@mui/material";

// function NavButtons() {
//   const { user, setUser } = useContext(UserContext);
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     setUser(null);
//     navigate("/login");
//   };

//   if (!user) return null;

//   return (
//     <>
//       <Button color="inherit" component={Link} to="/profile">
//         Profil
//       </Button>
//       <Button color="error" onClick={handleLogout}>
//         Déconnexion
//       </Button>
//     </>
//   );
// }

// function AppContent() {
//   return (
//     <>
//       <AppBar position="static">
//         <Toolbar>
//           <Typography variant="h6" sx={{ flexGrow: 1 }}>
//             HackaTweet
//           </Typography>
//           <NavButtons />
//         </Toolbar>
//       </AppBar>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/profile" element={<Profile />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//       </Routes>
//     </>
//   );
// }

// function App() {
//   return (
//     <UserProvider>
//       <Router>
//         <AppContent />
//       </Router>
//     </UserProvider>
//   );
// }

// export default App;
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Link,
} from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useContext } from "react";
import { UserContext, UserProvider } from "./context/UserContext"; // Assurez-vous que UserProvider est exporté correctement
import { Button, AppBar, Toolbar, Typography } from "@mui/material";

function NavButtons() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (!user) return null;

  return (
    <>
      <Button color="inherit" component={Link} to="/profile">
        Profil
      </Button>
      <Button color="error" onClick={handleLogout}>
        Déconnexion
      </Button>
    </>
  );
}

function AppContent() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HackaTweet
          </Typography>
          <NavButtons />
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;
