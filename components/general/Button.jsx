"use client";

export default function Button({
  color = 'blue',
  btnText,
  btnType,
  disabled,
  size = 'default',
  onClick
}) {
  const colors = {
    blue: 'bg-blue-700 hover:bg-blue-800 text-white',
    green: 'bg-dark-green hover:bg-green-800 text-white', 
    red: 'bg-red-500 hover:bg-red-600 text-white',
    gray: 'bg-gray-300 hover:bg-dark-green text-white',
    transparent: 'bg-transparent hover: bg-gray-400 text-black',
    white:'bg-white hover:bg-gray-100 text-black'
  };


  const sizes = {
    default: 'w-72',
    small: 'w-48',
    xl: 'w-108',
    large: 'w-96',
    xs: 'w-24',
    xxs: 'w-12'
  };

  return (
    <button
      type={btnType === "submit" ? "submit" : "button"}
      disabled={disabled}
      onClick={onClick}
      className={`
        ${colors[color]}
        ${sizes[size]}
        rounded-full
        text-md font-bold py-3 px-4
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {btnText}
    </button>
  );
}
