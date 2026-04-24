import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import "leaflet/dist/leaflet.css";
import "../utils/fixLeafletIcons.js";

const AuthLayout = lazy(() => import("../layouts/AuthLayout"));
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));

const LandingPage = lazy(() => import("../modules/common/pages/LandingPage"));
const NotFoundPage = lazy(() => import("../modules/common/pages/NotFoundPage"));

const LoginPage = lazy(() => import("../modules/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../modules/auth/pages/RegisterPage"));
const ProfilePage = lazy(() => import("../modules/auth/pages/ProfilePage"));

const HomePage = lazy(() => import("../modules/dashboard/pages/HomePage"));

const IncidentsPage = lazy(() => import("../modules/incidents/pages/IncidentsPage"));
const IncidentDetailPage = lazy(() => import("../modules/incidents/pages/IncidentDetailPage"));
const NearbyIncidentsPage = lazy(() => import("../modules/incidents/pages/NearbyIncidentsPage"));
const IncidentsRealtimeFeed = lazy(() => import("../modules/incidents/pages/IncidentsRealtimeFeed"));

const TasksPage = lazy(() => import("../modules/tasks/pages/TasksPage"));
const NotificationsCenter = lazy(() => import("../modules/Notifications/NotificationsCenter"));

const IncidentsMapPage = lazy(() => import("../modules/geospartial/pages/IncidentsMapPage"));

const AnalyticsDashboardPage = lazy(() => import("../modules/analytics/pages/analyticsDashboardPage"));

const GuidelinesListPage = lazy(() => import("../modules/preparedness/pages/GuidelinesListPage"));
const PersonalizedGuidelinesPage = lazy(() => import("../modules/preparedness/pages/PersonalizedGuidelinesPage"));

const EmergencyContactsPage = lazy(() => import("../modules/emergency/pages/EmergencyContactsPage"));
const SosTriggerPage = lazy(() => import("../modules/emergency/pages/SosTriggerPage"));

import RequireAuth from "./RequireAuth";

const withSuspense = (Component ) => (
  <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(LandingPage),
  },

  {
    path: "/login",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthLayout>
          <RegisterPage />
        </AuthLayout>
      </Suspense>
    ),
  },

  {
    path: "/app",
    element: (
      <RequireAuth>
        <Suspense fallback={<div>Loading...</div>}>
          <DashboardLayout />
        </Suspense>
      </RequireAuth>
    ),
    children: [
      { path: "home", element: withSuspense(HomePage) },

      { path: "profile", element: withSuspense(ProfilePage) },

      { path: "incidents", element: withSuspense(IncidentsPage) },
      { path: "incidents/:incidentId", element: withSuspense(IncidentDetailPage) },
      { path: "incidents/nearby", element: withSuspense(NearbyIncidentsPage) },
      { path: "incidents/map", element: withSuspense(IncidentsMapPage) },
      { path: "incidents/realtime", element: withSuspense(IncidentsRealtimeFeed) },

      { path: "notifications", element: withSuspense(NotificationsCenter) },

      { path: "tasks", element: withSuspense(TasksPage) },

      { path: "analytics", element: withSuspense(AnalyticsDashboardPage) },

      { path: "guidelines", element: withSuspense(GuidelinesListPage) },
      {
        path: "personalized-guidelines",
        element: withSuspense(PersonalizedGuidelinesPage),
      },

      { path: "emergency-contacts", element: withSuspense(EmergencyContactsPage) },
      { path: "sos-trigger", element: withSuspense(SosTriggerPage) },
    ],
  },

  {
    path: "*",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthLayout>
          <NotFoundPage />
        </AuthLayout>
      </Suspense>
    ),
  },
]);