export default function ProfileSection ({ children, title }) {
  return (
    <div className="space-y-3">
      <div className="h-2"></div>
      <h3 className="text-blue-900 font-medium text-sm mb-5">{title}</h3>
      <div className="h-2"></div>
      {children}
    </div>
  );
}
