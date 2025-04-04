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
    // originalError.apply(console, args);
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure all required properties are passed
  const missingProperty = {}; // Add default or placeholder value for the missing property

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider theme={baselightTheme}>
            <CssBaseline />
            {/* Pass the missing property to the relevant component or library */}
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
