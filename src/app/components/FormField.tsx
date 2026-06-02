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
      <span className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className="w-full rounded border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
      />
    </label>
  );
}
