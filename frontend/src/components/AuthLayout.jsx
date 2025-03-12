import React from 'react';
import { Box, Container, Grid, Typography, Paper, ThemeProvider } from '@mui/material';
import authTheme from '../theme/authTheme';

const AuthLayout = ({ children, title, subtitle }) => {
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
        <Container maxWidth="lg">
          <Grid container spacing={8} justifyContent="center" alignItems="center">
            <Grid item xs={12} md={5} lg={4}>
              <Box 
                sx={{ 
                  textAlign: 'center',
                  mb: { xs: 3, md: 0 }
                }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500,
                    mb: 3
                  }}
                >
                  Le réseau social décontracté qui fait du bien
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} lg={5}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  borderRadius: 4,
                  backgroundColor: 'background.paper',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
                }}
              >
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Typography 
                    variant="h4" 
                    component="h2" 
                    sx={{ 
                      color: 'secondary.main',
                      mb: 1
                    }}
                  >
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography 
                      variant="body1"
                      color="text.secondary"
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Box>
                {children}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AuthLayout; 