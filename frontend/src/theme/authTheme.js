import { createTheme } from '@mui/material/styles';

const authTheme = createTheme({
  palette: {
    primary: {
      main: '#FF6B6B', // Rouge énergique
      light: '#FF8787',
      dark: '#D32F2F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4ECDC4', // Turquoise dynamique
      light: '#7DE2D1',
      dark: '#3BA399',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFEFEF', // Fond rose doux
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 5,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          padding: '12px 28px',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#FF6B6B',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        },
      },
    },
  },
});

export default authTheme;
