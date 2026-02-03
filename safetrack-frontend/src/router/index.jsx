import { createBrowserRouter } from "react-router-dom";
import 'leaflet/dist/leaflet.css';
import "../utils/fixLeafletIcons.js";

// layouts
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// common pages
import LandingPage from "../modules/common/pages/LandingPage";
import NotFoundPage from "../modules/common/pages/NotFoundPage";

// auth pages
import LoginPage from "../modules/auth/pages/LoginPage";
import RegisterPage from "../modules/auth/pages/RegisterPage";
import ProfilePage from "../modules/auth/pages/ProfilePage";

// dashboard root
import HomePage from "../modules/dashboard/pages/HomePage";

// incidents
import IncidentsPage from "../modules/incidents/pages/IncidentsPage.jsx";
import IncidentDetailPage from "../modules/incidents/pages/IncidentDetailPage.jsx";
import NearbyIncidentsPage from "../modules/incidents/pages/NearbyIncidentsPage.jsx";
import IncidentsRealtimeFeed from "../modules/incidents/pages/IncidentsRealtimeFeed.jsx";

// tasks
import TasksPage from "../modules/tasks/pages/TasksPage.jsx";
import NotificationsCenter from "../modules/Notifications/NotificationsCenter.jsx";
// geospatial / maps
import IncidentsMapPage from "../modules/geospartial/pages/IncidentsMapPage.jsx";

// analytics
import AnalyticsDashboardPage from "../modules/analytics/pages/analyticsDashboardPage.jsx";

// preparedness
import GuidelinesListPage from "../modules/preparedness/pages/GuidelinesListPage.jsx";
import PersonalizedGuidelinesPage from "../modules/preparedness/pages/PersonalizedGuidelinesPage";

// emergency module
import EmergencyContactsPage from "../modules/emergency/pages/EmergencyContactsPage.jsx";
import SosTriggerPage from "../modules/emergency/pages/SosTriggerPage.jsx";


// auth guard
import RequireAuth from "./RequireAuth";

export const router = createBrowserRouter([
  // public routes
  {
    path: "/",
    element: <LandingPage />,
  },

  // authentication flows
  {
    path: "/login",
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: "/register",
    element: (
      <AuthLayout>
        <RegisterPage />
      </AuthLayout>
    ),
  },

  // protected application shell
  {
    path: "/app",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      // dashboard overview
      { path: "home", element: <HomePage /> },

      // profile & account
      { path: "profile", element: <ProfilePage /> },

      // incidents module
      { path: "incidents", element: <IncidentsPage /> },
      { path: "incidents/:incidentId", element: <IncidentDetailPage /> },
      { path: "incidents/nearby", element: <NearbyIncidentsPage /> },
      { path: "incidents/map", element: <IncidentsMapPage /> },
      { path: "incidents/realtime", element: <IncidentsRealtimeFeed /> },
      { path: "notifications", element: <NotificationsCenter /> },
      // risk module
     

      // tasks & operations
      { path: "tasks", element: <TasksPage /> },

      // analytics & insights
      { path: "analytics", element: <AnalyticsDashboardPage /> },

      // preparedness
      { path: "guidelines", element: <GuidelinesListPage /> },
      {
        path: "personalized-guidelines",
        element: <PersonalizedGuidelinesPage />,
      },

      // emergency tools
      { path: "emergency-contacts", element: <EmergencyContactsPage /> },
      { path: "sos-trigger", element: <SosTriggerPage /> },
    ],
  },

  // 404 fallback
  {
    path: "*",
    element: (
      <AuthLayout>
        <NotFoundPage />
      </AuthLayout>
    ),
  },
]);
