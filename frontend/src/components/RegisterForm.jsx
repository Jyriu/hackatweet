import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  Alert, 
  CircularProgress, 
  Grid,
  InputAdornment,
  IconButton,
  Box
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BioIcon from '@mui/icons-material/Description';

const RegisterForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    username: "",
    bio: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, error, loading } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.username) return;
    
    try {
      await register(formData);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Erreur d'inscription:", err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ textAlign: 'center' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Nom" name="nom" variant="outlined" onChange={handleChange} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Prénom" name="prenom" variant="outlined" onChange={handleChange} required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Nom d'utilisateur" name="username" variant="outlined" onChange={handleChange} required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Adresse Email" name="email" type="email" variant="outlined" onChange={handleChange} required />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Mot de passe"
            name="password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Bio" name="bio" variant="outlined" multiline rows={3} onChange={handleChange} />
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
          transition: "all 0.3s ease",
          '&:hover': { transform: "scale(1.05)" }
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "S'inscrire"}
      </Button>
    </Box>
  );
};

export default RegisterForm;
