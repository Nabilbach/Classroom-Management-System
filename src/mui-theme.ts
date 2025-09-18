import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: '#1E88E5',
    },
    secondary: {
      main: '#FF8A65',
    },
  },
});

export default muiTheme;