type SettingsToggleRowProps = {
  label: string;
  sub?: string;
  on: boolean;
  onToggle: () => void;
};

export default function SettingsToggleRow({ label, sub, on, onToggle }: SettingsToggleRowProps) {
  return (
    <div className="settings-toggle-row">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {sub && <p className="text-caption text-xs mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        className={`toggle-switch ${on ? "on" : ""}`}
        onClick={onToggle}
        aria-pressed={on}
        aria-label={label}
      />
    </div>
  );
}