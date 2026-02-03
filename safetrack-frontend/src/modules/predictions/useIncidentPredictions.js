// src/modules/predictions/useIncidentPredictions.js
import { useCallback, useEffect, useState } from "react";
import {
  getPredictionsByIncident,
  createPrediction,
} from "./api/predictionsApi";

export function useIncidentPredictions(incidentId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (opts = {}) => {
      if (!incidentId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getPredictionsByIncident(incidentId, opts);
        setItems(data);
      } catch (e) {
        const detail = e?.response?.data?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          setError(detail[0].msg);
        } else if (typeof detail === "string") {
          setError(detail);
        } else {
          setError("Failed to load predictions");
        }
      } finally {
        setLoading(false);
      }
    },
    [incidentId]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function addPrediction(input) {
    try {
      setError(null);
      const payload = {
        incident_id: incidentId,
        risk_type: input.risk_type, // "flood" | "cyclone" | ...
        probability: input.probability,
        confidence_score: input.confidence_score ?? null,
        model_version: input.model_version || null,
        algorithm: input.algorithm || null,
      };
      const created = await createPrediction(payload);
      setItems((prev) => [created, ...prev]);
    } catch (e) {
      const detail = e?.response?.data?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        setError(detail[0].msg);
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Failed to create prediction");
      }
    }
  }

  return { items, loading, error, reload: load, addPrediction };
}
