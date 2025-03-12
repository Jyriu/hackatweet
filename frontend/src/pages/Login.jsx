import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton, 
  Alert, 
  CircularProgress, 
  Typography,
  Box,
  Divider,
  Link
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../components/AuthLayout";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    
    if (!email || !password) {
      return; // Simple validation
    }
    
    try {
      console.log("Tentative de connexion...");
      await login({ email, password });
      console.log("Connexion réussie, redirection vers /");
      
      // Redirection vers la page d'accueil (forcée avec un délai)
      setTimeout(() => {
        console.log("Redirection forcée");
        navigate("/", { replace: true });
      }, 100);
    } catch (err) {
      // L'erreur est déjà gérée par le hook useAuth
      console.error("Erreur de connexion:", err);
    }
  };

  return (
    <AuthLayout 
      title="Bienvenue" 
      subtitle="Heureux de vous revoir ! Connectez-vous pour continuer"
    >
      <form onSubmit={handleLogin}>
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
        
        <TextField
          fullWidth
          label="Adresse Email"
          type="email"
          margin="normal"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: 'primary.main' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          label="Mot de passe"
          type={showPassword ? "text" : "password"}
          margin="normal"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          sx={{ mb: 3 }}
        />
        
        <Button 
          fullWidth 
          variant="contained" 
          color="primary" 
          type="submit"
          size="large"
          disabled={loading || !email || !password}
          sx={{ 
            py: 1.5,
            mb: 2
          }} 
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Se connecter"
          )}
        </Button>
        
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OU
          </Typography>
        </Divider>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Vous n'avez pas encore de compte ?
          </Typography>
          <Link 
            component={RouterLink} 
            to="/register" 
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
            Inscrivez-vous
          </Link>
        </Box>
      </form>
    </AuthLayout>
  );
};

export default Login;
