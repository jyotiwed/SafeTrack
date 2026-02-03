import { useEffect, useState } from "react";
import {
  listEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact, // ← new
  deleteEmergencyContact,  // ← new
} from "../api/emergencyApi";

const predefinedServices = [
  {
    name: "Police",
    phone: "100 / 112",
    relationship: "Emergency",
    note: "National Police / Unified Emergency",
    bg: "bg-blue-950/60 border-blue-500/30",
  },
  {
    name: "Fire Brigade",
    phone: "101",
    relationship: "Emergency",
    note: "Fire & Rescue",
    bg: "bg-red-950/60 border-red-500/30",
  },
  {
    name: "Ambulance",
    phone: "102 / 108",
    relationship: "Emergency",
    note: "Medical Emergency (varies by state)",
    bg: "bg-green-950/60 border-green-500/30",
  },
];

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState(null);

  // Edit mode state
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listEmergencyContacts();
      setContacts(data || []);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to load emergency contacts."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(contact) {
    setEditingId(contact.id);
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship || "");
    setError(null);
    setSuccessMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setPhone("");
    setRelationship("");
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const phoneTrim = phone.trim();
    const isShortCode = /^\d{3}$/.test(phoneTrim);
    const isIndianMobile = /^(\+91)?[6-9]\d{9}$/.test(phoneTrim.replace(/\s/g, ""));
    const isValid = isShortCode || isIndianMobile || phoneTrim.startsWith("+");

    if (!isValid) {
      setError("Please enter a valid phone number (3-digit emergency code or 10-digit mobile / international format).");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg("");

      const payload = {
        name: name.trim(),
        phone: phoneTrim,
        relationship: relationship.trim() || null,
      };

      if (editingId) {
        await updateEmergencyContact(editingId, payload);
        setSuccessMsg("Contact updated successfully!");
      } else {
        await createEmergencyContact(payload);
        setSuccessMsg("Contact added successfully!");
      }

      setTimeout(() => setSuccessMsg(""), 4000);

      cancelEdit();
      await load();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : editingId
          ? "Failed to update contact."
          : "Failed to add contact."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this emergency contact?")) return;

    try {
      setDeletingId(id);
      setError(null);
      await deleteEmergencyContact(id);
      setSuccessMsg("Contact deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      await load();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to delete contact."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 p-4 sm:p-6 bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-50">
          Emergency Contacts
        </h1>
        <p className="text-sm text-slate-400">
          Trusted people (and official services) to be notified during SOS from SafeTrack.
        </p>
      </header>

      {/* Official Emergency Services */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-200">
          Official Emergency Services (India)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {predefinedServices.map((service) => (
            <div
              key={service.name}
              className={`rounded-2xl border p-4 backdrop-blur ${service.bg}`}
            >
              <div className="font-semibold text-slate-100">{service.name}</div>
              <div className="text-lg font-bold text-white mt-1">{service.phone}</div>
              <div className="text-xs text-slate-300 mt-1">
                {service.relationship} • {service.note}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          For any emergency, dial <strong>112</strong> (unified national number) first.
        </p>
      </section>

      {/* Form – Add or Edit */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur"
      >
        {(error || successMsg) && (
          <div
            className={`rounded-xl px-4 py-3 text-xs ${
              successMsg
                ? "border-green-500/40 bg-green-500/10 text-green-200"
                : "border-red-500/40 bg-red-500/10 text-red-200"
            }`}
          >
            {successMsg || error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium text-slate-300">
              Name *
            </label>
            <input
              id="name"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
              placeholder="John Doe, Dr. Sharma…"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="phone" className="text-xs font-medium text-slate-300">
              Phone Number *
            </label>
            <input
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
              placeholder="+91 98765 43210 or 100"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="relationship" className="text-xs font-medium text-slate-300">
              Relationship (optional)
            </label>
            <input
              id="relationship"
              maxLength={50}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
              placeholder="Mother, Friend, Doctor…"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            {editingId
              ? "Editing contact – make changes and save."
              : "Tip: Add 2–3 trusted contacts for reliability."}
          </p>
          <div className="flex gap-3">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !name.trim() || !phone.trim()}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving
                ? editingId
                  ? "Updating…"
                  : "Adding…"
                : editingId
                ? "Save Changes"
                : "Add Contact"}
            </button>
          </div>
        </div>
      </form>

      {/* Personal Contacts List */}
      <section className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur">
        <h2 className="text-base font-semibold text-slate-200 mb-4">
          Your Personal Emergency Contacts
        </h2>

        {loading ? (
          <div className="text-center text-slate-400 py-10">Loading contacts…</div>
        ) : contacts.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 text-center text-slate-400">
            <p className="text-base font-medium text-slate-100">
              No personal contacts added yet.
            </p>
            <p className="max-w-md text-sm">
              Add trusted people here. Official emergency numbers are always available above.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-slate-900/70 px-4 py-3 hover:bg-slate-800/70 transition"
              >
                <div className="flex-1">
                  <div className="text-base font-semibold text-slate-50">{c.name}</div>
                  <div className="text-sm text-slate-300">
                    {c.phone}
                    {c.relationship && ` • ${c.relationship}`}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="text-slate-500 whitespace-nowrap">
                    Added {new Date(c.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  <button
                    onClick={() => startEdit(c)}
                    disabled={editingId === c.id || deletingId === c.id}
                    className="rounded-lg bg-amber-600/80 px-3 py-1.5 text-white hover:bg-amber-500 transition disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id || editingId !== null}
                    className="rounded-lg bg-red-600/80 px-3 py-1.5 text-white hover:bg-red-500 transition disabled:opacity-50"
                  >
                    {deletingId === c.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}