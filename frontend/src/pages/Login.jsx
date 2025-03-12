import React, { useState } from "react";
import { Container, TextField, Button, Card, CardContent, Typography, Alert, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login({ email, password });
      // Redirection vers la page d'accueil
      navigate("/");
    } catch (err) {
      // L'erreur est déjà gérée par le hook useAuth
      console.error("Erreur de connexion:", err);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ marginTop: 5 }}>
      <Card sx={{ padding: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" color="primary">
            Connexion
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Adresse Email"
            margin="normal"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            margin="normal"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button 
            fullWidth 
            variant="contained" 
            color="primary" 
            sx={{ marginTop: 2 }} 
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Se connecter"}
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
