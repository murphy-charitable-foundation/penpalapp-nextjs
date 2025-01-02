const Button = ({ type = "info", onClick, size = "md", children }) => {
  const baseClasses = "py-1 px-3 rounded-full font-semibold";

  const typeClasses = {
    success: "bg-green-700 text-white",
    info: "text-green-700 bg-gray-100",
    danger: "bg-red-700 text-white",
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const buttonClasses = `${baseClasses} ${typeClasses[type]} ${sizeClasses[size]}`;

  return (
    <button onClick={onClick} className={buttonClasses}>
      {children}
    </button>
  );
};

export default Button;
