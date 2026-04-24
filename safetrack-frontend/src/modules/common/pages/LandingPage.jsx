// src/modules/common/pages/LandingPage.jsx

import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CheckCircle } from "lucide-react";

import "leaflet/dist/leaflet.css";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 text-white">
      
      {/* Background Glow */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -left-32 top-20 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-3xl"></div>
        <div className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT SECTION */}
          <div className="space-y-8 text-center lg:text-left">

            <div className="inline-flex items-center gap-3 rounded-full bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30 backdrop-blur-md">
              Real-time • Community Safety
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span className="block">Your Neighborhood.</span>
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                Safer Together.
              </span>
            </h1>

            <p className="text-lg text-slate-300 max-w-xl mx-auto lg:mx-0">
              SafeTrack connects residents, RWAs and security teams
              to report incidents, coordinate response and build
              safer communities — instantly and transparently.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-semibold shadow-lg hover:scale-105 transition"
              >
                Get Started Free
              </Link>

              <Link
                to="/login"
                className="rounded-xl border border-slate-600 px-8 py-4 text-slate-200 hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
            </div>

            <div className="pt-6 space-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                End-to-end encrypted
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                Resident-only access
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                24×7 monitoring alerts
              </div>
            </div>
          </div>

          {/* RIGHT SECTION — MAP */}
          <div className="relative h-[500px] lg:h-[650px] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900/60 backdrop-blur-xl">
            
            <MapContainer
              center={[18.5204, 73.8567]} // Pune
              zoom={11}
              className="h-full w-full"
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MarkerClusterGroup chunkedLoading>

                <Marker position={[18.5204, 73.8567]}>
                  <Popup>
                    <strong className="text-red-600">Fire Hazard</strong><br />
                    Sector 7 • High • 12 min ago
                  </Popup>
                </Marker>

                <Marker position={[18.531, 73.84]}>
                  <Popup>
                    <strong className="text-red-600">Road Accident</strong><br />
                    Ring Road • High • 28 min ago
                  </Popup>
                </Marker>

                <Marker position={[18.55, 73.88]}>
                  <Popup>
                    <strong className="text-amber-500">Water Logging</strong><br />
                    Block C • Medium
                  </Popup>
                </Marker>

                <Marker position={[18.49, 73.82]}>
                  <Popup>
                    <strong className="text-emerald-500">Rescue Completed</strong><br />
                    Garden • Resolved
                  </Popup>
                </Marker>

              </MarkerClusterGroup>

              <ZoomControl position="bottomright" />
            </MapContainer>

            {/* Floating Labels */}
            <div className="absolute top-4 left-4 z-[1000] rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold shadow-lg">
              Live Incidents Preview
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-slate-900/80 px-6 py-2 text-sm text-slate-300 border border-slate-700">
              Sign in to see real-time incidents in your society
            </div>

          </div>
        </div>

        {/* STATS */}
        <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-10 text-center">
          {[
            { value: "3,200+", label: "Active Residents" },
            { value: "240+", label: "Societies Joined" },
            { value: "4.9/5", label: "Community Rating" },
            { value: "~4 min", label: "Avg First Response" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-bold text-emerald-400">
                {stat.value}
              </div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
