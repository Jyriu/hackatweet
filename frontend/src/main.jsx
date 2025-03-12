import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/Store";
import App from "./App";
import { UserProvider } from "./context/UserContext";
import { CssBaseline } from "@mui/material";
import "./index.css";

// Rendu avec Redux Provider
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
