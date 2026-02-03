import Logo from "../../auth/components/Logo";
export default function NotFoundPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <Logo size="md" />
      </div>
      <div className="space-y-2">
        <p className="text-4xl font-bold text-slate-100">404</p>
        <p className="text-sm text-slate-300">
          The page you are looking for does not exist.
        </p>
        <p className="text-xs text-slate-500">
          Maybe the incident moved, or the link is outdated.
        </p>
      </div>
      <a
        href="/login"
        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:brightness-110"
      >
        Back to SafeTrack login
      </a>
    </div>
  );
}
