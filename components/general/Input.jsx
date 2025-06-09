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
  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium mb-1 text-gray-500`}
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
          bg-white
          border-b
          ${error ? "border-red-500" : "border-gray-300"}
          w-full
          px-4 py-2
        
          outline-none
          text-gray-900 
          placeholder:text-gray-400 focus:border-black
          transition-colors
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
} 