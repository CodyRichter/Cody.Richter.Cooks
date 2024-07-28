import "@mantine/core/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";

import App from "./App";
import { AuthProvider } from "src/common/contexts/AuthContext/AuthContext";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom/client";

const theme = createTheme({
  /** Put your mantine theme override here */
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <MantineProvider theme={theme}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </MantineProvider>
);
