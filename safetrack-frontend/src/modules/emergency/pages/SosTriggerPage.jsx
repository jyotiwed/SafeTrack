import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { triggerSos } from "../api/emergencyApi";

// Custom emergency icon (adjust path or use public URL)
const emergencyIcon = new L.Icon({
  iconUrl: "/images/emergency-pin.png", // ← Put your red emergency pin here
  // Fallback public red marker for testing:
  // iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [38, 45],
  iconAnchor: [19, 45], // anchor at bottom center
  popupAnchor: [0, -45],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [68, 45],
  shadowAnchor: [22, 45],
});

// Fix default icons if needed (import in index.js if issues persist)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: emergencyIcon.options.iconUrl,
  iconUrl: emergencyIcon.options.iconUrl,
  shadowUrl: emergencyIcon.options.shadowUrl,
});

export default function SosTriggerPage() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState(""); // Approximate address
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setFeedback({ type: "success", text: "App installation started!" });
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Fetch approximate address using Nominatim reverse geocoding
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setAddress("Loading address...");
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: {
            "User-Agent": "SafeTrack-SOS-App (contact: your@email.com)", // Required by Nominatim policy
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data?.display_name) {
            setAddress(data.display_name);
          } else if (data?.address) {
            const addr = data.address;
            setAddress(
              `${addr.road || addr.neighbourhood || ""}, ${addr.city || addr.town || ""}, ${addr.state || ""}`
            );
          } else {
            setAddress("Address not found");
          }
        })
        .catch(() => setAddress("Could not load address"));
    } else {
      setAddress("");
    }
  }, [latitude, longitude]);

  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      setFeedback({ type: "error", text: "Geolocation not supported." });
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");
    setFeedback(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
      setLocationStatus("success");
      setFeedback({ type: "success", text: "Location acquired!" });
    } catch (err) {
      let msg = "Location fetch failed.";
      if (err.code === 1) msg = "Permission denied – enable location access.";
      if (err.code === 3) msg = "Timed out – try again.";
      setFeedback({ type: "error", text: msg });
      setLocationStatus("error");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (confirming) {
      if (!latitude || !longitude) {
        setFeedback({ type: "error", text: "Location required." });
        return;
      }

      try {
        setSending(true);
        setFeedback(null);

        const payload = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          message: message.trim() || "SOS from SafeTrack",
        };

        const res = await triggerSos(payload);
        setFeedback({
          type: "success",
          text: "SOS sent successfully!",
        });

        setTimeout(() => {
          setLatitude("");
          setLongitude("");
          setAddress("");
          setMessage("");
          setConfirming(false);
          setFeedback(null);
        }, 8000);
      } catch (err) {
        setFeedback({ type: "error", text: "Failed to send SOS." });
      } finally {
        setSending(false);
      }
    } else {
      if (!latitude || !longitude) {
        setFeedback({ type: "error", text: "Set location first." });
        return;
      }
      setConfirming(true);
      setFeedback({
        type: "warning",
        text: "Confirm? This notifies contacts immediately.",
      });
    }
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="flex h-full flex-col gap-6 p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-red-950/30 to-slate-950">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-red-50">Emergency SOS</h1>
        <p className="text-sm text-red-200/90">
          Verify location on map & address below before sending.
        </p>
      </header>

      {/* PWA Install Button */}
      {showInstallButton && (
        <button
          onClick={handleInstall}
          className="self-start rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-600 transition"
        >
          Install SafeTrack App
        </button>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col gap-5 rounded-2xl border border-red-600/60 bg-slate-950/80 p-5 backdrop-blur-md shadow-2xl shadow-red-900/30"
      >
        {/* Warning */}
        <div className="flex items-start gap-3 rounded-xl border border-red-500/70 bg-red-900/30 px-4 py-3 text-sm text-red-100">
          <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-lg font-bold">
            !
          </span>
          <div>
            <p className="font-medium">Real emergencies only</p>
            <p className="text-xs text-red-200/80 mt-1">
              In India: Dial 112 if possible.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              feedback.type === "success"
                ? "bg-emerald-900/40 border-emerald-600/60 text-emerald-100"
                : feedback.type === "warning"
                ? "bg-amber-900/40 border-amber-600/60 text-amber-100"
                : "bg-red-900/50 border-red-600/70 text-red-100"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Map with custom icon */}
        <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden border border-red-600/50 shadow-lg">
          {hasValidCoords ? (
            <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lat, lng]} icon={emergencyIcon}>
                <Popup>Your emergency location</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-900/70 text-slate-300 text-sm">
              Map shows after location is set
            </div>
          )}
        </div>

        {/* Approximate Address */}
        {address && (
          <div className="text-sm text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
            <strong>Near:</strong> {address}
          </div>
        )}

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={locationStatus === "loading" || sending}
          className="self-start rounded-xl bg-blue-700/80 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition disabled:opacity-50"
        >
          {locationStatus === "loading" ? "Fetching…" : "📍 Use My Location"}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">Latitude *</label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="rounded-xl border border-red-600/50 bg-slate-900/70 px-4 py-3 text-base text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/40"
              placeholder="18.5204"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">Longitude *</label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="rounded-xl border border-red-600/50 bg-slate-900/70 px-4 py-3 text-base text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/40"
              placeholder="73.8567"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-200">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="e.g. Medical emergency near Chinchwad..."
            className="rounded-xl border border-red-600/50 bg-slate-900/70 px-4 py-3 text-base text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/40 resize-none"
          />
        </div>

        <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-red-800/40">
          <p className="text-xs text-red-300/80">
            {confirming ? "Final confirmation — cannot undo." : "Check map & address above."}
          </p>

          <div className="flex gap-3">
            {confirming && (
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setFeedback(null);
                }}
                className="rounded-full px-6 py-3 text-base font-semibold bg-slate-700 text-white hover:bg-slate-600 transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={sending || !hasValidCoords}
              className={`rounded-full px-8 py-4 text-lg font-bold text-white shadow-xl transition-all duration-200 ${
                confirming
                  ? "bg-amber-600 hover:bg-amber-500 animate-pulse"
                  : "bg-red-700 hover:bg-red-600"
              } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-red-500/50`}
            >
              {sending
                ? "Sending..."
                : confirming
                ? "CONFIRM & SEND"
                : "SEND SOS NOW"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}