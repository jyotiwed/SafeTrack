// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

import "leaflet/dist/leaflet.css";
import "react-leaflet-markercluster/dist/styles.min.css";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Routes>
          {/* Landing page with attractive design + incident preview map */}
          <Route
            path="/"
            element={
              <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
                {/* Background blobs */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute -left-32 top-20 h-[500px] w-[500px] animate-blob-slow rounded-full bg-emerald-600/10 blur-3xl"></div>
                  <div className="absolute right-0 bottom-0 h-[600px] w-[600px] animate-blob animation-delay-4000 rounded-full bg-cyan-600/10 blur-3xl"></div>
                </div>

                <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
                  <div className="grid lg:grid-cols-2 lg:gap-16 items-center">
                    {/* Left side - Text + CTA */}
                    <div className="space-y-10 text-center lg:text-left">
                      <div className="inline-flex items-center gap-3 rounded-full bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30 backdrop-blur-md">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                        </span>
                        Real-time • Community Safety
                      </div>

                      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                        <span className="block text-white">Your Neighborhood.</span>
                        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                          Safer Together.
                        </span>
                      </h1>

                      <p className="max-w-xl mx-auto lg:mx-0 text-lg sm:text-xl text-slate-300 leading-relaxed">
                        SafeTrack connects residents, RWAs, security teams and volunteers to report incidents, coordinate help, and build safer communities — instantly and transparently.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-6">
                        <Link
                          to="/register"
                          className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-5 text-lg font-semibold text-white shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                        >
                          Start Protecting Your Society
                          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </Link>

                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/50 px-8 py-5 text-lg font-medium text-slate-200 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-slate-700/60 hover:text-white"
                        >
                          Already a member? Sign in
                        </Link>
                      </div>

                      <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4 pt-8 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                          End-to-end encrypted
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                          Resident-only access
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                          24×7 monitoring alerts
                        </div>
                      </div>
                    </div>

                    {/* Right side – Interactive map preview */}
                    <div className="relative mt-16 lg:mt-0 h-[480px] sm:h-[560px] lg:h-[680px] rounded-3xl overflow-hidden border border-slate-700/40 shadow-2xl shadow-black/50 bg-slate-900/60 backdrop-blur-xl">
                      <MapContainer
                        center={[18.5204, 73.8567]} // Pune center
                        zoom={11}
                        className="h-full w-full"
                        zoomControl={false}
                        attributionControl={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />

                        <MarkerClusterGroup chunkedLoading>
                          {/* Example mock incidents */}
                          <Marker position={[18.5204, 73.8567]}>
                            <Popup>
                              <div className="text-sm">
                                <strong className="text-rose-600">Fire hazard</strong><br />
                                Sector 7 • High • 12 min ago
                              </div>
                            </Popup>
                          </Marker>

                          <Marker position={[18.531, 73.84]}>
                            <Popup>
                              <div className="text-sm">
                                <strong className="text-rose-600">Road accident</strong><br />
                                Ring Road • High • 28 min ago
                              </div>
                            </Popup>
                          </Marker>

                          <Marker position={[18.55, 73.88]}>
                            <Popup>
                              <div className="text-sm">
                                <strong className="text-amber-500">Water logging</strong><br />
                                Block C • Medium
                              </div>
                            </Popup>
                          </Marker>

                          <Marker position={[18.49, 73.82]}>
                            <Popup>
                              <div className="text-sm">
                                <strong className="text-emerald-500">Stray dog rescue</strong><br />
                                Garden • Resolved
                              </div>
                            </Popup>
                          </Marker>
                        </MarkerClusterGroup>

                        <ZoomControl position="bottomright" />
                      </MapContainer>

                      {/* Floating label */}
                      <div className="absolute top-4 left-4 z-[1000] rounded-full bg-emerald-600/80 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-white shadow-lg ring-1 ring-emerald-400/30">
                        Live Incidents Preview
                      </div>

                      {/* Bottom hint */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-slate-900/80 backdrop-blur-md px-6 py-2.5 text-sm text-slate-300 shadow-lg border border-slate-700/50">
                        Sign in to see real-time incidents in your society
                      </div>
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="mt-20 grid grid-cols-2 gap-8 text-center lg:mt-28 lg:grid-cols-4 lg:gap-12">
                    {[
                      { value: "3,200+", label: "Active Residents" },
                      { value: "240+", label: "Societies Joined" },
                      { value: "4.9/5", label: "Community Rating" },
                      { value: "~4 min", label: "Avg First Response" },
                    ].map((stat, i) => (
                      <div key={i} className="space-y-3">
                        <div className="text-4xl font-bold text-emerald-400">{stat.value}</div>
                        <div className="text-base text-slate-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </main>
            }
          />

          {/* Other routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="flex min-h-screen items-center justify-center">
                <h2 className="text-2xl text-slate-200">
                  404 · Page not found.{" "}
                  <Link to="/" className="text-emerald-400 underline">
                    Go home
                  </Link>
                </h2>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;