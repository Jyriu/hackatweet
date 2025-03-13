import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton, 
  Alert, 
  CircularProgress, 
  Box
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const LoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, loading } = useAuth();

  const handleLogin = async (e) => {
    e?.preventDefault();
    
    if (!email || !password) {
      return; // Simple validation
    }
    
    try {
      await login({ email, password });
      // Appeler la fonction de réussite fournie par le parent
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // L'erreur est déjà gérée par le hook useAuth
      console.error("Erreur de connexion:", err);
    }
  };

  return (
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
    </form>
  );
};

export default LoginForm; 