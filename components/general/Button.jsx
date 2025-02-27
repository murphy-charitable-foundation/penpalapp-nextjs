export default function Button({
  color,
  textColor,
  btnText,
  hoverColor,
  btnType,
  disabled,
  hoverTextClr,
  font,
  rounded,
  size,
}) {
  return (
    <button
      type={btnType === "submit" ? "submit" : "button"}
      disabled={disabled}
      className={`text-sm font-medium  ${color} ${hoverColor} ${textColor} ${hoverTextClr} ${font}  font-bold py-2 px-4  ${rounded}  ${size ? size : "w-72"}`}
    >
      {btnText}
    </button>
  );
}
