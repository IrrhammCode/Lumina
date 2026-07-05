export default function MetaRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="detail-meta-row">
      <span className="text-caption text-sm">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-positive" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}