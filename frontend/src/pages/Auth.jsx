import React, { useState } from "react";
import { 
  Box, 
  Tab, 
  Tabs, 
  Container, 
  Paper,
  Typography,
  ThemeProvider,
  Slide,
  Fade,
  useTheme
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import authTheme from "../theme/authTheme";

// TabPanel composant pour l'affichage conditionnel des formulaires
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Fade in={value === index} timeout={500}>
            <div>{children}</div>
          </Fade>
        </Box>
      )}
    </div>
  );
}

// Fonction pour gérer l'accessibilité des onglets
function a11yProps(index) {
  return {
    id: `auth-tab-${index}`,
    'aria-controls': `auth-tabpanel-${index}`,
  };
}

const Auth = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Déterminer l'onglet initial en fonction du chemin ou du paramètre dans l'URL
  const getInitialTab = () => {
    // Si on vient de /login, on affiche l'onglet de connexion
    if (location.state?.from === '/login') return 0;
    // Si on vient de /register, on affiche l'onglet d'inscription
    if (location.state?.from === '/register') return 1;
    
    // Par défaut, afficher l'onglet d'inscription (comme demandé précédemment)
    return 1;
  };
  
  const [tabValue, setTabValue] = useState(getInitialTab());
  const [slideDirection, setSlideDirection] = useState('left');

  // Gestion du changement d'onglet avec animation
  const handleTabChange = (event, newValue) => {
    setSlideDirection(newValue > tabValue ? 'left' : 'right');
    setTabValue(newValue);
  };

  // Fonction de rappel pour un succès d'authentification
  const onAuthSuccess = () => {
    navigate('/');
  };

  return (
    <ThemeProvider theme={authTheme}>
      <Box 
        sx={{ 
          minHeight: '100vh',
          backgroundColor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <Slide direction={slideDirection} in={true} mountOnEnter unmountOnExit timeout={400}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 0, 
                borderRadius: 4,
                backgroundColor: 'background.paper',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                    aria-label="auth tabs"
                  >
                    <Tab 
                      label={
                        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                          Connexion
                        </Typography>
                      } 
                      {...a11yProps(0)} 
                    />
                    <Tab 
                      label={
                        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                          Inscription
                        </Typography>
                      } 
                      {...a11yProps(1)} 
                    />
                  </Tabs>
                </Box>
                
                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ maxWidth: 500, mx: 'auto', py: 2 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                      Bienvenue sur HackaTweet
                    </Typography>
                    <Typography variant="body1" align="center" color="text.secondary" paragraph sx={{ mb: 4 }}>
                      Connectez-vous pour accéder à votre compte
                    </Typography>
                    <LoginForm onSuccess={onAuthSuccess} />
                  </Box>
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ maxWidth: 650, mx: 'auto', py: 2 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                      Rejoignez HackaTweet
                    </Typography>
                    <Typography variant="body1" align="center" color="text.secondary" paragraph sx={{ mb: 4 }}>
                      Créez votre compte en quelques étapes simples
                    </Typography>
                    <RegisterForm onSuccess={onAuthSuccess} />
                  </Box>
                </TabPanel>
              </Box>
              
              {/* Pied de page */}
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'background.default', 
                  textAlign: 'center',
                  borderTop: 1,
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {tabValue === 0 ? (
                    <Box component="span">
                      Pas encore de compte ? 
                      <Box 
                        component="span" 
                        onClick={() => handleTabChange(null, 1)}
                        sx={{ 
                          cursor: 'pointer', 
                          ml: 1,
                          color: 'primary.main',
                          fontWeight: 'bold',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        Inscrivez-vous
                      </Box>
                    </Box>
                  ) : (
                    <Box component="span">
                      Déjà un compte ? 
                      <Box 
                        component="span" 
                        onClick={() => handleTabChange(null, 0)}
                        sx={{ 
                          cursor: 'pointer', 
                          ml: 1,
                          color: 'primary.main',
                          fontWeight: 'bold',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        Connectez-vous
                      </Box>
                    </Box>
                  )}
                </Typography>
              </Box>
            </Paper>
          </Slide>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Auth; 