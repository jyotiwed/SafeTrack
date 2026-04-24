// src/modules/emergency/EmergencyContactsPage.jsx
import { useEffect, useState } from "react";
import {
  listEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "../api/emergencyApi";
import {
  Phone, User, Heart, AlertCircle, CheckCircle2,
  Loader2, Pencil, Trash2, X, Plus, ShieldAlert,
} from "lucide-react";

/* ─── Static data ─────────────────────────────────────────────────────────── */
const EMERGENCY_SERVICES = [
  { name: "Police",       phone: "100 / 112", note: "National Police / Unified Emergency", textCls: "text-blue-400",    borderCls: "border-blue-500/20",    bgCls: "bg-blue-400/[0.07]",    glowCls: "bg-blue-400/10",    dotCls: "bg-blue-400"    },
  { name: "Fire Brigade", phone: "101",        note: "Fire & Rescue",                       textCls: "text-red-400",     borderCls: "border-red-500/20",     bgCls: "bg-red-400/[0.07]",     glowCls: "bg-red-400/10",     dotCls: "bg-red-400"     },
  { name: "Ambulance",    phone: "102 / 108",  note: "Medical Emergency (varies by state)", textCls: "text-emerald-400", borderCls: "border-emerald-500/20", bgCls: "bg-emerald-400/[0.07]", glowCls: "bg-emerald-400/10", dotCls: "bg-emerald-400" },
];

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function EmergencyContactsPage() {
  const [contacts,     setContacts]     = useState([]);
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [successMsg,   setSuccessMsg]   = useState("");
  const [error,        setError]        = useState(null);
  const [editingId,    setEditingId]    = useState(null);
  const [deletingId,   setDeletingId]   = useState(null);

  async function load() {
    try {
      setLoading(true); setError(null);
      const data = await listEmergencyContacts();
      setContacts(data || []);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to load emergency contacts.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startEdit(c) {
    setEditingId(c.id); setName(c.name); setPhone(c.phone);
    setRelationship(c.relationship || ""); setError(null); setSuccessMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null); setName(""); setPhone(""); setRelationship(""); setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const t = phone.trim();
    const valid = /^\d{3}$/.test(t) || /^(\+91)?[6-9]\d{9}$/.test(t.replace(/\s/g,"")) || t.startsWith("+");
    if (!valid) { setError("Enter a valid phone number (3-digit code, 10-digit mobile, or international +XX format)."); return; }
    try {
      setSaving(true); setError(null); setSuccessMsg("");
      const payload = { name: name.trim(), phone: t, relationship: relationship.trim() || null };
      if (editingId) { await updateEmergencyContact(editingId, payload); setSuccessMsg("Contact updated!"); }
      else           { await createEmergencyContact(payload);            setSuccessMsg("Contact added!");   }
      setTimeout(() => setSuccessMsg(""), 4000);
      cancelEdit(); await load();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : editingId ? "Failed to update." : "Failed to add.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this emergency contact?")) return;
    try {
      setDeletingId(id); setError(null);
      await deleteEmergencyContact(id);
      setSuccessMsg("Contact deleted."); setTimeout(() => setSuccessMsg(""), 4000); await load();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to delete.");
    } finally { setDeletingId(null); }
  }

  const inputCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 transition-colors focus:border-cyan-400/35 focus:bg-cyan-400/[0.03]";
  const labelCls = "flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[.14em] text-zinc-500 mb-[5px]";

  return (
    <div className="min-h-screen bg-[#09090b] px-7 pb-20 text-zinc-200 max-sm:px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-6 pb-16 sm:px-8">

        {/* ── TOPBAR ── */}
        <div className="flex items-center justify-between border-b border-white/[0.06] py-[18px] mb-9">
          <div className="flex items-center gap-2.5">
            <div className="h-[7px] w-[7px] rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px] font-semibold tracking-[.15em] text-cyan-400 uppercase">SafeTrack ICC</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-[7px] text-[13px] font-semibold text-zinc-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] hover:text-cyan-400 transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        {/* ── HERO ── */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[.22em] text-cyan-400/55">
            <div className="text-justify bg-cyan-400/40" /> Emergency Management
          </div>
          <h1 className="mb-1.5 text-[30px] font-extrabold tracking-tight text-white max-sm:text-2xl">Emergency Contacts</h1>
          <p className="font-mono text-[10px] tracking-[.1em] text-zinc-600 uppercase">
            TRUSTED PEOPLE · OFFICIAL SERVICES · SOS NOTIFICATION
          </p>
        </div>

        {/* ── OFFICIAL SERVICES ── */}
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[.16em] text-zinc-600">Official Emergency Numbers</p>
        <div className="mb-3 grid grid-cols-3 gap-2.5 max-md:grid-cols-1">
          {EMERGENCY_SERVICES.map(s => (
            <div key={s.name} className={`relative overflow-hidden rounded-xl border ${s.borderCls} ${s.bgCls} p-4`}>
              <div className={`absolute inset-x-0 top-0 h-[2px] ${s.dotCls} opacity-50`} />
              <div className="mb-2.5 flex items-center gap-2">
                <div className={`flex h-[26px] w-[26px] items-center justify-center rounded-[7px] ${s.glowCls} border border-white/[0.07]`}>
                  <ShieldAlert size={12} className={s.textCls} />
                </div>
                <span className={`font-mono text-[10px] font-semibold uppercase tracking-[.1em] ${s.textCls}`}>{s.name}</span>
              </div>
              <p className={`mb-0.5 text-[24px] font-black tracking-tight leading-none ${s.textCls}`}>{s.phone}</p>
              <p className="font-mono text-[9px] text-zinc-500 mt-1">{s.note}</p>
            </div>
          ))}
        </div>
        <p className="mb-7 font-mono text-[9px] text-zinc-600">
          Dial <span className="font-bold text-red-400">112</span> for any emergency — works even without a SIM card.
        </p>

        {/* ── ADD / EDIT FORM ── */}
        <div className={`relative mb-7 overflow-hidden rounded-2xl border p-6 transition-colors ${editingId ? "border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.04] to-transparent" : "border-white/[0.07] bg-white/[0.02]"}`}>
          {editingId && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />}

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
              {editingId ? <Pencil size={14} /> : <Plus size={14} />}
            </div>
            <div>
              <p className="text-[14px] font-bold text-zinc-200">{editingId ? "Edit Contact" : "Add New Contact"}</p>
              <p className="font-mono text-[9px] uppercase tracking-[.08em] text-cyan-400/40 mt-0.5">
                {editingId ? "Update existing entry" : "Add to your SOS list"}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 font-mono text-[12px] text-red-400">
              <AlertCircle size={13} className="shrink-0" /> {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-3.5 py-2.5 font-mono text-[12px] text-emerald-400">
              <CheckCircle2 size={13} className="shrink-0" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3 max-md:grid-cols-[1fr_1fr] max-sm:grid-cols-1">
              <div>
                <label className={labelCls}><User size={9} /> Name</label>
                <input className={inputCls} required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="John Doe…" />
              </div>
              <div>
                <label className={labelCls}><Phone size={9} /> Phone Number</label>
                <input className={inputCls} required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210 or 100" />
              </div>
              <div>
                <label className={labelCls}><Heart size={9} /> Relationship</label>
                <input className={inputCls} maxLength={50} value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="Mother, Doctor…" />
              </div>
              <div className="flex gap-1.5 items-end pt-[22px] max-md:pt-0 max-md:col-span-2 max-sm:col-span-1">
                {editingId && (
                  <button type="button" onClick={cancelEdit}
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:border-cyan-400/25 hover:text-cyan-400 transition-colors">
                    <X size={13} />
                  </button>
                )}
                <button type="submit" disabled={saving || !name.trim() || !phone.trim()}
                  className="flex h-[38px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-4 text-[12px] font-bold text-cyan-400 hover:bg-cyan-400/[0.18] transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : editingId ? <Pencil size={13} /> : <Plus size={13} />}
                  {saving ? (editingId ? "Updating…" : "Adding…") : (editingId ? "Save Changes" : "Add Contact")}
                </button>
              </div>
            </div>
            {!editingId && <p className="mt-3 font-mono text-[9px] text-zinc-600">Add 2–3 trusted contacts for reliability during emergencies.</p>}
          </form>
        </div>

        {/* ── CONTACTS LIST ── */}
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[.14em] text-zinc-500">Your Contacts</span>
          {!loading && <span className="font-mono text-[11px] text-cyan-400/60">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</span>}
          {loading  && <Loader2 size={12} className="animate-spin text-cyan-400/60" />}
        </div>

        {loading && (
          <div className="flex flex-col gap-2">
            {[0,1,2].map(i => <div key={i} className="h-[72px] rounded-xl border border-white/[0.05] bg-white/[0.02]" />)}
          </div>
        )}

        {!loading && contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-6 py-16 text-center">
            <Phone size={36} className="opacity-10" />
            <p className="text-[14px] font-bold text-zinc-600">No contacts added yet</p>
            <p className="font-mono text-[9px] tracking-[.04em] text-zinc-700">Official emergency numbers are always available above</p>
          </div>
        )}

        {!loading && contacts.length > 0 && (
          <div className="flex flex-col gap-2">
            {contacts.map(c => (
              <div key={c.id}
                className={`flex items-center justify-between gap-4 rounded-xl border bg-white/[0.025] px-5 py-3.5 transition-colors hover:border-white/10 hover:bg-white/[0.04] max-sm:flex-col max-sm:items-start ${editingId === c.id ? "border-cyan-400/30" : "border-white/[0.06]"}`}>
                <div className="flex flex-1 items-center gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-cyan-400/20 bg-cyan-400/10">
                    <User size={15} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[14px] font-bold text-zinc-200">{c.name}</p>
                    <p className="font-mono text-[11px] text-zinc-500">
                      <span className="text-zinc-400">{c.phone}</span>
                      {c.relationship && <span className="text-zinc-600"> · {c.relationship}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:justify-end">
                  {c.created_at && <span className="font-mono text-[9px] text-zinc-700">{fmtDate(c.created_at)}</span>}
                  <button onClick={() => startEdit(c)} disabled={!!editingId || deletingId === c.id}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1.5 font-mono text-[10px] font-bold text-amber-400 hover:bg-amber-500/[0.15] transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id || !!editingId}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-3 py-1.5 font-mono text-[10px] font-bold text-red-400 hover:bg-red-500/[0.15] transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                    {deletingId === c.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    {deletingId === c.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}