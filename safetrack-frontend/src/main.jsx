// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";
import { RouterProvider } from "react-router-dom";
import { NotificationsProvider } from "./modules/Notifications/NotificationsContext.jsx";
import { IncidentNotifications } from "./modules/Notifications/IncidentNotifications.jsx";
import { router } from "./router";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  // no StrictMode to avoid double websocket in dev
  <NotificationsProvider>
    <RouterProvider router={router} />
    {/* Optional toast overlay; remove if you want only bell & center */}
    <IncidentNotifications />
  </NotificationsProvider>
 
);
