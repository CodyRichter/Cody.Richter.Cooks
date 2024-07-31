import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "src/styles/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";

import App from "./App";
import { AuthProvider } from "src/common/contexts/AuthContext/AuthContext";
import { HashRouter } from "react-router-dom";
import { Notifications } from "@mantine/notifications";
import React from "react";
import ReactDOM from "react-dom/client";

const theme = createTheme({
  /** Put your mantine theme override here */
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <MantineProvider theme={theme}>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
      <Notifications autoClose={4000} position="top-center" />
    </HashRouter>
  </MantineProvider>
);
