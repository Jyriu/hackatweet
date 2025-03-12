import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  Alert, 
  CircularProgress, 
  Grid,
  Box,
  InputAdornment,
  IconButton,
  Divider,
  Typography,
  Link
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../components/AuthLayout";
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BioIcon from '@mui/icons-material/Description';

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    username: "",
    bio: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();
  const url = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!formData.email || !formData.password || !formData.username) {
      return;
    }

    try {
      console.log("Tentative d'inscription...");
      await register(formData);
      console.log("Inscription réussie, redirection vers /");
      
      // Redirection vers la page d'accueil (forcée avec un délai)
      setTimeout(() => {
        console.log("Redirection forcée");
        navigate("/", { replace: true });
      }, 100);
    } catch (err) {
      // L'erreur est déjà gérée par le hook useAuth
      console.error("Erreur d'inscription:", err);
    }
  };

  return (
    <AuthLayout 
      title="Créer un compte" 
      subtitle="Rejoignez notre communauté et commencez à partager"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              fontSize: '0.9rem'
            }}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nom"
              name="nom"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prénom"
              name="prenom"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              name="username"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adresse Email"
              name="email"
              type="email"
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mot de passe"
              name="password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              onChange={handleChange}
              disabled={loading}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              variant="outlined"
              multiline
              rows={3}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <BioIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Button 
          type="submit" 
          fullWidth 
          variant="contained" 
          color="primary" 
          size="large"
          disabled={loading || !formData.email || !formData.password || !formData.username}
          sx={{ 
            py: 1.5,
            mt: 3,
            mb: 2
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" /> 
          ) : (
            "S'inscrire"
          )}
        </Button>
        
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OU
          </Typography>
        </Divider>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Vous avez déjà un compte ?
          </Typography>
          <Link 
            component={RouterLink} 
            to="/login" 
            variant="body1"
            sx={{ 
              color: 'primary.main',
              fontWeight: 500,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Connectez-vous
          </Link>
        </Box>
      </form>
    </AuthLayout>
  );
};

export default Register;
