import { createTheme } from "@mui/material/styles";

// Color palette
export const colors = {
  // Brand
  deepNavy: "#1A365D", // primary brand, manifest theme
  slateCharcoal: "#2D3748", // primary text
  skyBlue: "#4299E1", // route/path, interactive
  mintCream: "#9AE6B4", // child icon / safe green
  pureWhite: "#FFFFFF", // main canvas
  // Extended
  lightBg: "#F7FAFC", // page background
  border: "#E2E8F0",
  mutedText: "#718096",
  successGreen: "#38A169",
  warningAmber: "#D69E2E",
  errorRed: "#E53E3E",
};

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.deepNavy,
      light: colors.skyBlue,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: colors.mintCream,
      contrastText: colors.slateCharcoal,
    },
    text: {
      primary: colors.slateCharcoal,
      secondary: colors.mutedText,
    },
    background: {
      default: colors.lightBg,
      paper: colors.pureWhite,
    },
    error: { main: colors.errorRed },
    warning: { main: colors.warningAmber },
    success: { main: colors.successGreen },
  },
  typography: {
    fontFamily: "var(--font-inter, system-ui, sans-serif)",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "10px",
          fontWeight: 600,
          padding: "10px 24px",
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${colors.deepNavy} 0%, ${colors.skyBlue} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${colors.skyBlue} 0%, ${colors.deepNavy} 100%)`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.skyBlue,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: "12px" },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: colors.deepNavy,
            color: "#FFFFFF",
            fontWeight: 600,
          },
        },
      },
    },
  },
});
