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
  Slide,
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setUser } from "../redux/Store"; // Ajustez le chemin d'import si nécessaire

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const Settings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const token = useSelector((state) => state.user.token);

  // États locaux pour les switches, initialisés par défaut
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Récupération des infos utilisateur complètes si nécessaire
  useEffect(() => {
    if (currentUser) {
      if (
        typeof currentUser.notifOn === "undefined" ||
        typeof currentUser.cameraOn === "undefined"
      ) {
        axios
          .get(`${API_URL}/api/user/by-username/${currentUser.username}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const updatedUser = res.data;
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
        setNotificationsEnabled(currentUser.notifOn);
        setCameraEnabled(currentUser.cameraOn);
      }
    }
  }, [currentUser, token, dispatch]);

  // Fonction de toggle pour mettre à jour via l'API
  const handleToggle = async (settingName) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/user/toggle/${settingName}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedValue = response.data[settingName];
      if (settingName === "notifOn") {
        setNotificationsEnabled(updatedValue);
      } else if (settingName === "cameraOn") {
        setCameraEnabled(updatedValue);
      }
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

  if (!currentUser) {
    return null;
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        mt: 6,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={500}>
        <Card
          sx={{
            width: "100%",
            maxWidth: "600px",
            p: 4,
            boxShadow: "0px 12px 32px rgba(0,0,0,0.15)",
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            transition: "transform 0.3s ease",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <CardContent>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                color: "#75B7B0",
                mb: 3,
              }}
            >
              Paramètres
            </Typography>
            <Box
              sx={{
                my: 3,
                transition: "transform 0.3s ease",
                "&:hover": { transform: "scale(1.02)" },
              }}
            >
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
            <Box
              sx={{
                my: 3,
                transition: "transform 0.3s ease",
                "&:hover": { transform: "scale(1.02)" },
              }}
            >
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
      </Slide>
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
