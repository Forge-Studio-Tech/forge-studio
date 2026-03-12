export default function StatusBadge({ label, active = false }) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
        ${active
          ? 'bg-copper/15 text-copper'
          : 'bg-portal-border/30 text-portal-muted'
        }
      `}
    >
      {label}
    </span>
  )
}
