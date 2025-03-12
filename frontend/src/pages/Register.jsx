import React, { useState } from "react";
import { Container, TextField, Button, Card, CardContent, Typography, Alert, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    username: "",
    bio: ""
  });

  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(formData);
      
      // Redirection vers la page d'accueil
      navigate("/");
    } catch (err) {
      // L'erreur est déjà gérée par le hook useAuth
      console.error("Erreur d'inscription:", err);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: 5 }}>
      <Card sx={{ padding: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" color="primary">
            Inscription
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nom"
              name="nom"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Prénom"
              name="prenom"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              name="username"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Adresse Email"
              name="email"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Mot de passe"
              name="password"
              type="password"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
              onChange={handleChange}
              disabled={loading}
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              color="primary" 
              sx={{ marginTop: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "S'inscrire"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Register;
