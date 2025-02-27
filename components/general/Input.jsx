export default function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  id,
  required = false,
  disabled = false,
  bgColor = "bg-white",
  textColor = "text-gray-900",
  borderColor = "border-gray-300",
  focusBorderColor = "focus:border-blue-500",
  placeholderColor = "placeholder:text-gray-400",
  rounded = "rounded-md",
  size = "w-full",
  padding = "px-4 py-2",
  error,
  label,
  labelColor = "text-gray-700",
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
      <input
        type={type}
        value={value}
        onChange={onChange}
        name={name}
        id={id}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          ${size}
          ${bgColor}
          ${textColor}
          ${rounded}
          ${padding}
          ${placeholderColor}
          border-b
          ${error ? "border-red-500" : borderColor}
          ${focusBorderColor}
          outline-none
          transition-colors
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
} 