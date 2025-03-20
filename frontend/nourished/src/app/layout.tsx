"use client";
import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { baselightTheme } from "@/utils/theme/DefaultColors";

// More effective fix for React 19 ref warnings
const originalError = console.error;
if (typeof window !== "undefined") {
  console.error = (...args) => {
    // Filter out React 19 ref deprecation warnings
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].includes("Accessing element.ref was removed in React 19")
    ) {
      return;
    }
    originalError(...args);
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("🔥 RootLayout is rendering...");

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {" "}
          <ThemeProvider theme={baselightTheme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
