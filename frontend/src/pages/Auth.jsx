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
  Fade
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import authTheme from "../theme/authTheme";

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 4 }}>
          <Fade in timeout={600}>
            <div>{children}</div>
          </Fade>
        </Box>
      )}
    </div>
  );
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTab = () => {
    if (location.state?.from === '/login') return 0;
    if (location.state?.from === '/register') return 1;
    return 1;
  };
  
  const [tabValue, setTabValue] = useState(getInitialTab());

  return (
    <ThemeProvider theme={authTheme}>
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={400}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 4, 
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ width: '100%', textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Bienvenue sur HackaTweet !
                </Typography>
                
                <Tabs 
                  value={tabValue} 
                  onChange={(event, newValue) => setTabValue(newValue)}
                  variant="fullWidth"
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab label="Connexion" sx={{ fontWeight: 700 }} />
                  <Tab label="Inscription" sx={{ fontWeight: 700 }} />
                </Tabs>
                
                <TabPanel value={tabValue} index={0}>
                  <LoginForm onSuccess={() => navigate('/')} />
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  <RegisterForm onSuccess={() => navigate('/')} />
                </TabPanel>
              </Box>
              
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2">
                  {tabValue === 0 ? "Pas encore de compte ?" : "Déjà un compte ?"}  
                  <Box 
                    component="span" 
                    onClick={() => setTabValue(tabValue === 0 ? 1 : 0)}
                    sx={{ 
                      cursor: 'pointer', 
                      ml: 1,
                      color: 'primary.main',
                      fontWeight: 'bold',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {tabValue === 0 ? "Inscrivez-vous" : "Connectez-vous"}
                  </Box>
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
