import Button from "./Button";

export default function WelcomeToast({ userName, onClose, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-green-200 p-4 max-w-xs animate-slide-in">
      <div className="flex items-start">
        <div className="bg-green-100 rounded-full p-2 mr-3">
          <svg className="w-6 h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">Welcome back, {userName}!</h3>
          <p className="text-sm text-gray-600">Check out your recent letters and stay connected.</p>
        </div>
        <Button
          onClick={onClose}
          btnText={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          color="bg-transparent"
          textColor="text-gray-400"
          hoverColor="hover:text-gray-600"
          rounded="rounded-full"
          size="w-4 h-4 flex items-center justify-center"
        />
      </div>
    </div>
  );
} 