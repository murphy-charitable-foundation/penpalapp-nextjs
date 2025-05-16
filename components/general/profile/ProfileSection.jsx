export default function ProfileSection ({ children, title }) {
  return (
    <div className="space-y-4">
      <div className="h-4"></div>
      <h3 className="text-blue-900 font-medium text-sm mb-5">{title}</h3>
      <div className="h-4"></div>
      {children}
    </div>
  );
}
