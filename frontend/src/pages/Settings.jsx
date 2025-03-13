import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setUser } from "../redux/Store"; // Ajustez le chemin d'import si nécessaire

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const Settings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const token = useSelector((state) => state.user.token);

  // États locaux pour les switches, initialisés par défaut (ici true en attendant les infos complètes)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // useEffect pour récupérer les infos utilisateur complètes si notifOn ou cameraOn sont undefined
  useEffect(() => {
    if (currentUser) {
      if (
        typeof currentUser.notifOn === "undefined" ||
        typeof currentUser.cameraOn === "undefined"
      ) {
        // Appel à l'API pour récupérer les infos complètes de l'utilisateur
        axios
          .get(`${API_URL}/api/user/by-username/${currentUser.username}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const updatedUser = res.data;
            // Mise à jour du store Redux avec les infos complètes
            dispatch(setUser(updatedUser));
            setNotificationsEnabled(
              updatedUser.notifOn !== undefined ? updatedUser.notifOn : true
            );
            setCameraEnabled(
              updatedUser.cameraOn !== undefined ? updatedUser.cameraOn : true
            );
          })
          .catch((error) => {
            console.error(
              "Erreur lors de la récupération des infos utilisateur:",
              error
            );
          });
      } else {
        // Si les infos existent déjà, on met à jour les états locaux
        setNotificationsEnabled(currentUser.notifOn);
        setCameraEnabled(currentUser.cameraOn);
      }
    }
  }, [currentUser, token, dispatch]);

  // Fonction générique de toggle qui met à jour via l'API et actualise Redux et le state local
  const handleToggle = async (settingName) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/user/toggle/${settingName}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // On s'attend à recevoir par exemple { notifOn: true } ou { cameraOn: true }
      const updatedValue = response.data[settingName];
      if (settingName === "notifOn") {
        setNotificationsEnabled(updatedValue);
      } else if (settingName === "cameraOn") {
        setCameraEnabled(updatedValue);
      }
      // Mettre à jour Redux pour que currentUser reflète les nouveaux paramètres
      dispatch(setUser({ ...currentUser, [settingName]: updatedValue }));
      setSnackbarMessage(
        settingName === "notifOn"
          ? updatedValue
            ? "Notifications activées"
            : "Notifications désactivées"
          : updatedValue
          ? "Caméra activée"
          : "Caméra désactivée"
      );
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Erreur lors du toggle:", error);
      setSnackbarMessage("Erreur lors de la mise à jour");
      setSnackbarOpen(true);
    }
  };

  const handleNotificationToggle = () => {
    handleToggle("notifOn");
  };

  const handleCameraToggle = () => {
    handleToggle("cameraOn");
  };

  // Tant que currentUser n'est pas chargé, on ne rend rien (ou on peut afficher un loader)
  if (!currentUser) {
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card sx={{ p: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h4" color="primary" gutterBottom>
            Paramètres
          </Typography>
          <Box sx={{ my: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationsEnabled}
                  onChange={handleNotificationToggle}
                  color="primary"
                />
              }
              label="Activer les notifications"
            />
          </Box>
          <Box sx={{ my: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={cameraEnabled}
                  onChange={handleCameraToggle}
                  color="primary"
                />
              }
              label="Activer la caméra"
            />
          </Box>
        </CardContent>
      </Card>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
