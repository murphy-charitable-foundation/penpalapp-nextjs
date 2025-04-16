export default function Button({
  variant = 'blue',
  btnText,
  btnType,
  disabled,
  size = 'default',
  rounded = 'medium'
}) {
  const variants = {
    blue: 'bg-blue-700 hover:bg-blue-800 text-white',
    green: 'bg-green-700 hover:bg-green-800 text-white', 
    red: 'bg-red-500 hover:bg-red-600 text-white'
  };

  const sizes = {
    default: 'w-72',
    small: 'w-48',
    large: 'w-96'
  };

  const roundedStyles = {
    medium: 'rounded-xl',
    large: 'rounded-full'
  };

  return (
    <button
      type={btnType === "submit" ? "submit" : "button"}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${roundedStyles[rounded]}
        text-sm font-bold py-2 px-4
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {btnText}
    </button>
  );
}
