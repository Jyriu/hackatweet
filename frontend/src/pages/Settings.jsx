import React, { useState, useEffect } from "react";
import { Container, Typography, Switch, FormControlLabel, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Settings = ({ onCameraToggle }) => {
  const navigate = useNavigate(); // Navigation pour rediriger après action

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    JSON.parse(localStorage.getItem("notificationsEnabled")) || false
  );
  const [cameraEnabled, setCameraEnabled] = useState(
    JSON.parse(localStorage.getItem("cameraEnabled")) || false
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fonction pour gérer le changement d'état des notifications
  const handleNotificationToggle = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem("notificationsEnabled", JSON.stringify(newState));
    setSnackbarMessage(newState ? "Notifications activées" : "Notifications désactivées");
    setOpenSnackbar(true);
    
    // Rediriger après 1,5 seconde seulement si l'utilisateur interagit
    setTimeout(() => navigate("/"), 1500);
  };

  // Fonction pour gérer le changement d'état de la caméra
  const handleCameraToggle = () => {
    const newState = !cameraEnabled;
    setCameraEnabled(newState);
    localStorage.setItem("cameraEnabled", JSON.stringify(newState));

    if (onCameraToggle) {
      onCameraToggle(newState);
    }

    setSnackbarMessage(newState ? "Caméra activée" : "Caméra désactivée");
    setOpenSnackbar(true);
    
    // Rediriger après 1,5 seconde seulement si l'utilisateur interagit
    setTimeout(() => navigate("/"), 1200);
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Paramètres
      </Typography>
      
      <FormControlLabel
        control={<Switch checked={notificationsEnabled} onChange={handleNotificationToggle} />}
        label="Activer les notifications"
      />
      
      <FormControlLabel
        control={<Switch checked={cameraEnabled} onChange={handleCameraToggle} />}
        label="Activer la caméra"
      />

      {/* Snackbar pour afficher les notifications */}
      <Snackbar open={openSnackbar} autoHideDuration={2000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="info">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
