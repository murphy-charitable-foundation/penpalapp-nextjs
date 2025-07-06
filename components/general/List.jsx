"use client";

export default function List({
  options,
  valueChange,
  closeList,
  currentValue,
}) {

  return (
    <div className="grid grid-cols-1 gap-3">
        {options.map((option) => (
          <button
            key={option}
            className={`p-3 rounded-lg text-left ${
              currentValue === option
                ? "bg-green-100 border border-green-500"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
            onClick={() => {
              valueChange(option);
              closeList();
            }}
          >
            {option}
          </button>
        ))}
    </div>
  );
}
