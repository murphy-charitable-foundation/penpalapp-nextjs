export default function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  id,
  required = false,
  disabled = false,
  error,
  label,
}) {
  // Checkboxes require different styling than text-based inputs.
  // Keeping their native appearance improves compatibility with Safari/iOS.
  const inputClass =
    type === "checkbox"
      ? `
          h-4 w-4
          shrink-0
          appearance-auto
          accent-green-600
          border border-gray-300
          bg-white
          disabled:opacity-50
          disabled:cursor-not-allowed
        `
      : `
          bg-white
          border-b
          ${error ? "border-red-500" : "border-gray-300"}
          w-full
          px-0 py-2
          font-semibold
          outline-none
          text-gray-500
          placeholder:text-gray-400
          focus:border-black
          transition-colors
          disabled:opacity-50
          disabled:cursor-not-allowed
        `;

  return (
    <div className="relative px-6">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-1 text-gray-500"
        >
          {label}
        </label>
      )}

      <input
        type={type}
        value={type !== "checkbox" ? value ?? "" : undefined}
        checked={type === "checkbox" ? !!value : undefined}
        onChange={onChange}
        name={name}
        id={id}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        max={
          type === "date"
            ? new Date().toISOString().split("T")[0]
            : undefined
        }
        className={inputClass}
      />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}