export default function Logo({ size = "md" }) {
  const textSize =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative flex h-9 w-9 items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500 via-emerald-400 to-purple-500 blur-[2px]" />
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-white shadow-lg shadow-cyan-500/40">
          ST
        </div>
      </div>
      <div className="flex flex-col">
        <span
          className={`font-semibold tracking-tight ${textSize} bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent`}
        >
          SafeTrack
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Incident & Emergency
        </span>
      </div>
    </div>
  );
}
