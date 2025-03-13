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
    
    if (!email || !password) return; 

    try {
      console.log("Tentative de connexion...");
      await login({ email, password });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Erreur de connexion:", err);
    }
  };

  return (
    <Box component="form" onSubmit={handleLogin} sx={{ textAlign: 'center' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
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
        sx={{ 
          mb: 2,
          transition: "all 0.3s ease",
          '&:focus-within': { transform: "scale(1.02)" }
        }}
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
              <IconButton onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ 
          mb: 3,
          transition: "all 0.3s ease",
          '&:focus-within': { transform: "scale(1.02)" }
        }}
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
          mb: 2,
          transition: "all 0.3s ease",
          '&:hover': { transform: "scale(1.05)" }
        }} 
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Se connecter"}
      </Button>
    </Box>
  );
};

export default LoginForm;
