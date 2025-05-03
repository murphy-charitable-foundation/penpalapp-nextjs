export default function Button({
  color = 'blue',
  btnText,
  btnType,
  disabled,
  textColor = 'white',
  size = 'default',
}) {
  const colors = {
    blue: 'bg-blue-700 hover:bg-blue-800 text-white',
    green: 'bg-[#4E802A] hover:bg-green-800 text-white', 
    red: 'bg-red-500 hover:bg-red-600 text-white',
    gray: 'bg-gray-300 hover: bg-gray-400 text-white',
    transparent: 'bg-transparent hover: bg-gray-400 text-black'
  };

  const sizes = {
    default: 'w-72',
    small: 'w-48',
    large: 'w-96',
    xs: 'w-24',
  };

  return (
    <button
      type={btnType === "submit" ? "submit" : "button"}
      disabled={disabled}
      className={`
        ${colors[color]}
        ${sizes[size]}
        ${textColor}
        rounded-full
        text-sm font-bold py-3 px-4
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {btnText}
    </button>
  );
}
