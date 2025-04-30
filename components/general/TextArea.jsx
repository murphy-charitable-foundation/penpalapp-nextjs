export default function TextArea({
  value,
  onChange,
  placeholder,
  name,
  id,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  focusBorderColor,
  placeholderColor,
  size,
  error,
  label,
  labelColor,
  resize,
}) {
  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium mb-1 ${labelColor}`}
        >
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        name={name}
        id={id}
        rows={rows}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`
          ${size}
          bg-[#ffffff]
          text-black
          rounded-lg
          p-4
          ${placeholderColor}
          ${resize}
          w-full
          border
          ${error ? "border-red-500" : "border-black"}
          ${focusBorderColor}
          outline-none
          transition-colors
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
      />
      {maxLength && value && (
        <div className="mt-1 text-sm text-gray-400">
          {value.length}/{maxLength}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
} 