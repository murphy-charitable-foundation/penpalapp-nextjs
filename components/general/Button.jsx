"use client";

export default function Button({
  color = 'blue',
  btnText,
  btnType,
  textColor='text-white',
  disabled,
  size = 'default',
  onClick,
  href,
  external = false,
  ...restOfProps
}) {
  const colors = {
    blue: 'bg-secondary hover:bg-secondary-light text-white',
    green: 'bg-primary hover:bg-primary-light text-white', 
    red: 'bg-red-500 hover:bg-red-600 text-white',
    gray: 'bg-gray-300 hover:bg-primary text-white',
    transparent: 'bg-transparent hover: bg-gray-400 text-black',
    white:'bg-white hover:bg-gray-100 text-black',
    black: 'bg-black hover:bg-gray-800 text-white'
  };


  const sizes = {
    default: 'w-72',
    small: 'w-48',
    xl: 'w-108',
    large: 'w-96',
    xs: 'w-24',
    xxs: 'w-12'
  };

  const classNames = `
    ${colors[color]}
    ${sizes[size]}
    rounded-full
    text-md font-bold py-3 px-4
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  if (href && external) {
    return (
      <div className="flex justify-center">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${classNames}`}
          {...restOfProps}
        >
          {btnText}
        </a>
      </div>
    );
  }

  return (
    <button
      type={btnType === "submit" ? "submit" : "button"}
      disabled={disabled}
      onClick={onClick}
      className={classNames}
      {...restOfProps}
    >
      {btnText}
    </button>
  );
}
