export function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div className="acl-skeleton-table" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="acl-skeleton-row">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="acl-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return <div className="acl-skeleton-card" aria-busy="true" />
}
