export default function AuthCard({ children }) {
  return (
    <div className="group relative rounded-3xl border px-8 py-10 shadow-2xl border-light-border dark:border-dark-border bg-light-content/5 dark:bg-dark-content/5">
      <div className="relative">{children}</div>
    </div>
  );
}