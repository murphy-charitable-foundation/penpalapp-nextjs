"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Input({
  type = "text",
  value,
  onChange,
  onFocus,
  placeholder,
  name,
  id,
  required = false,
  disabled = false,
  error,
  label,
  suppressHydrationWarning = false,
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative px-6">
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium mb-1 text-gray-500`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          suppressHydrationWarning={suppressHydrationWarning}
          type={isPassword && passwordVisible ? "text" : type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          name={name}
          id={id}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          max={type=="date" ? new Date().toISOString().split("T")[0] : undefined}
          className={`
            bg-white
            border-b
            ${error ? "border-red-500" : "border-gray-300"}
            w-full
            px-0 py-2
            ${isPassword ? "pr-12" : ""}
            font-semibold
            outline-none
            text-gray-500
            placeholder:text-gray-400 focus:border-black
            transition-colors
            disabled:opacity-50
            disabled:cursor-not-allowed
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            disabled={disabled}
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-controls={id}
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-green disabled:cursor-not-allowed disabled:opacity-50"
          >
            {passwordVisible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
