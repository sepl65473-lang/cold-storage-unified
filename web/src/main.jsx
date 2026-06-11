import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { QueryProvider } from "./app/providers/QueryProvider.jsx";
import { ErrorBoundary } from "./app/providers/ErrorBoundary.jsx";
import { ENV } from "./config/env.js";
import { clearSession, getToken } from "./shared/auth/session.js";
import "./index.css";

// When switching between mock and live mode, the old token becomes invalid.
// Auto-clear it so the user sees a clean login page instead of API errors.
const MODE_KEY = "sepl_last_mode";
const currentMode = ENV.USE_MOCK ? "mock" : "live";
const lastMode = localStorage.getItem(MODE_KEY);
if (lastMode !== null && lastMode !== currentMode && getToken()) {
  clearSession();
}
localStorage.setItem(MODE_KEY, currentMode);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
