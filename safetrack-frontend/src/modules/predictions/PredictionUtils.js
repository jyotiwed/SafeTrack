// src/modules/predictions/PredictionUtils.js

export const RISK_TYPE_LABELS = {
  flood: "Flood",
  cyclone: "Cyclone",
  earthquake: "Earthquake",
  landslide: "Landslide",
  wildfire: "Wildfire",
};
export const RISK_COLORS = {
  flood: "#3b82f6",      // Blue
  cyclone: "#8b5cf6",    // Violet
  earthquake: "#ef4444", // Red
  landslide: "#f59e0b",  // Amber
  wildfire: "#f97316",   // Orange
};
export function getRiskColor(riskType) {
  return RISK_COLORS[riskType] || "#94a3b8"; // Default gray
}

export function probabilityToBadge(prob) {
  if (prob < 0.25) {
    return {
      label: "Low",
      cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/60",
    };
  }
  if (prob < 0.5) {
    return {
      label: "Moderate",
      cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/60",
    };
  }
  if (prob < 0.75) {
    return {
      label: "High",
      cls: "bg-orange-500/20 text-orange-300 border-orange-500/60",
    };
  }
  return {
    label: "Severe",
    cls: "bg-red-500/20 text-red-300 border-red-500/60",
  };
}
export function formatProbability(prob) {
  if (prob == null) return "N/A";
  return `${(prob * 100).toFixed(1)}%`;
}

export function formatConfidence(conf) {
  if (conf == null) return "N/A";
  return `${(conf * 100).toFixed(1)}%`;
}



