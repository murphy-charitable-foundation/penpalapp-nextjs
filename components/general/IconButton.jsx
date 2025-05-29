export default function IconButton({ 
  icon: Icon,
  onClick,
  className = "",
  ariaLabel,
  disabled = false
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`text-black p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
} 