export default function Button({ color, btnText, hoverColor, btnType }) {
  return (
    <button
      type={btnType === "submit" ? "submit" : "button"}
      className={`${color} hover:${hoverColor} text-white font-bold py-2 px-4  rounded-md  w-72`}
    >
      {btnText}
    </button>
  );
}
