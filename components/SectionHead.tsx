export default function SectionHead({
  eyebrow,
  title,
  action,
  onAction,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`section-head ${compact ? "section-head-compact" : ""}`}>
      <div className="section-head-text">
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
      </div>
      {action && onAction && (
        <button type="button" onClick={onAction} className="section-link">
          {action}
        </button>
      )}
    </div>
  );
}