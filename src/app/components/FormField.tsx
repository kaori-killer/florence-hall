type Props = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
};

export function FormField({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
  defaultValue,
}: Props) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-foreground-2 mb-1.5">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
