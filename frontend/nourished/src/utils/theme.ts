import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: "#226019",
    },
    secondary: {
      main: "#308125",
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
