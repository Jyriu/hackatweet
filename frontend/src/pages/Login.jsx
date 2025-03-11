import React, { useState, useContext } from "react";
import axios from "axios";
import { Container, TextField, Button, Card, CardContent, Typography, Alert } from "@mui/material";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Envoi de la requête POST au backend
<<<<<<< HEAD
      const response = await axios.post("http://localhost:5000/api/auth/login", {
=======
      const response = await axios.post("http://localhost:5001/api/auth/login", {
>>>>>>> origin/feat-ai-implementation-frontend-backend
        email,
        password,
      });

      // Récupération de la réponse
      const { token, user } = response.data;

      // Sauvegarde du token JWT dans le localStorage
      localStorage.setItem("token", token);

      // Mise à jour du contexte utilisateur
      setUser(user);

      // Redirection vers la page d'accueil
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la connexion");
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
          />
          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            margin="normal"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button 
            fullWidth 
            variant="contained" 
            color="primary" 
            sx={{ marginTop: 2 }} 
            onClick={handleLogin}
          >
            Se connecter
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
