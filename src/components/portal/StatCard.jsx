export default function StatCard({ label, value, subtitle, accent = false }) {
  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl p-5">
      <p className="text-portal-muted text-xs font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent ? 'text-copper' : 'text-portal-text'}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-portal-muted text-sm mt-1">{subtitle}</p>
      )}
    </div>
  )
}
