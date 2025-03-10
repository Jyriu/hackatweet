import React, { useState, useContext } from "react";
import { Container, TextField, Button, Card, CardContent, Typography } from "@mui/material";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username.trim() !== "") {
      setUser({ username });
      navigate("/");  // Redirection vers la page d'accueil après connexion
    }
  };

  return (
    <Container maxWidth="xs" sx={{ marginTop: 5 }}>
      <Card sx={{ padding: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" color="primary">
            Connexion
          </Typography>
          <TextField
            fullWidth
            label="Nom d'utilisateur"
            margin="normal"
            variant="outlined"
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            margin="normal"
            variant="outlined"
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button fullWidth variant="contained" color="primary" sx={{ marginTop: 2 }} onClick={handleLogin}>
            Se connecter
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
