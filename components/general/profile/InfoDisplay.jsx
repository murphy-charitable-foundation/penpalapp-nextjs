export default function InfoDisplay({children, title, info = ""}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg">{children}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{title}</p>
        <span className={`font-semibold ${info != "" ? "" : "text-gray-500"}`}>
          {info != "" ? info : "Unknown"}
        </span>
      </div>
    </div>
  );
}
