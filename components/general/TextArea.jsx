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
  size,
  error,
  label,
  resize,
}) {
  const sizes = {
    default: 'w-72',
    small: 'w-48',
    large: 'w-96',
    xs: 'w-24',
  };
  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium mb-1 text-black`}
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
          ${sizes[size]}
          bg-[#ffffff]
          text-black
          rounded-lg
          p-4
          placeholder-gray-400
          ${resize}
          w-full
          border
          ${error ? "border-red-500" : "border-gray-400"}
          focus:border-black
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