"use client";

import { useEffect, useState, useRef } from "react";
import Button from "./Button";

const sizes = {
  default: "w-72 max-w-sm",
  small: "w-48 max-w-sm",
  large: "w-full max-w-sm",
  xs: "w-12 max-w-sm",
  closeDialog: "w-[345px] max-w-sm",
};

// Button variants for consistent styling
const buttonVariants = {
  primary: {
    className: "text-white hover:opacity-90 transition-colors",
    style: { backgroundColor: "#4E802A" },
  },
  secondary: {
    className: "bg-gray-200 hover:bg-gray-300 transition-colors",
    style: { color: "#4E802A" },
  },
  danger: {
    className: "bg-red-500 text-white hover:bg-red-600 transition-colors",
    style: {},
  },
  // Add more variants as needed
};

export default function Modal({
  isOpen,
  onClose,
  title,
  content,
  width = "default",
  closeOnOverlay = true,
  showCloseButton = true,

  // Button configuration - can be array of button objects or legacy props
  buttons = [],

  // Legacy props for backward compatibility (close dialog)
  isCloseDialog = false,
  subtitle,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryAction,
  onSecondaryAction,

  // Layout variants
  variant = "default", // "default" | "closeDialog" | "alert" | "confirmation"

  // Custom styling overrides
  containerClassName = "",
  titleClassName = "",
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Legacy support: Convert old props to new button format
  const resolvedButtons = buttons.length > 0 ? buttons : [];

  if (isCloseDialog && primaryButtonText && secondaryButtonText) {
    resolvedButtons.push(
      {
        text: primaryButtonText,
        onClick: onPrimaryAction,
        variant: "primary",
        className: "flex-1",
      },
      {
        text: secondaryButtonText,
        onClick: onSecondaryAction,
        variant: "secondary",
        className: "flex-1",
      }
    );
  }

  // Render button with consistent styling
  const renderButton = (button, index) => {
    const variant = buttonVariants[button.variant] || buttonVariants.primary;
    const combinedClassName = `${variant.className} ${
      button.className || ""
    } py-3 px-4 rounded-2xl`;

    return (
      <button
        key={index}
        onClick={button.onClick}
        disabled={button.disabled}
        className={combinedClassName}
        style={{ ...variant.style, ...(button.style || {}) }}
        type={button.type || "button"}>
        {button.text}
      </button>
    );
  };

  // Unified Dialog Layout (close dialog, alert, confirmation)
  if (
    isCloseDialog ||
    variant === "closeDialog" ||
    variant === "alert" ||
    variant === "confirmation"
  ) {
    // Determine styling based on variant
    const isCloseDialogStyle = isCloseDialog || variant === "closeDialog";
    const backgroundOpacity = isCloseDialogStyle
      ? "bg-opacity-30"
      : "bg-opacity-70";
    const containerBg = isCloseDialogStyle ? "bg-gray-100" : "bg-white";
    const containerWidth = isCloseDialogStyle ? "w-[345px]" : "w-[300px]";
    const containerRounding = isCloseDialogStyle ? "rounded-2xl" : "rounded-md";
    const containerPadding = isCloseDialogStyle ? "p-6" : "p-4";
    const titleSize = isCloseDialogStyle ? "text-xl" : "text-sm";
    const titleWeight = isCloseDialogStyle ? "font-semibold" : "font-semibold";
    const titleColor = isCloseDialogStyle ? "text-black" : titleClassName || "";
    const buttonSpacing = isCloseDialogStyle ? "space-x-3" : "gap-2";
    const buttonLayout = isCloseDialogStyle
      ? "flex"
      : "flex justify-between w-full";
    const contentAlignment =
      variant === "alert" || variant === "confirmation"
        ? "flex flex-col items-center"
        : "";

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black ${backgroundOpacity} backdrop-blur-sm`}>
        <div
          className={`${containerBg} ${containerPadding} ${containerRounding} shadow-lg ${containerWidth} mx-auto ${contentAlignment} ${containerClassName}`}>
          <h2
            className={`${titleSize} ${titleWeight} mb-1 leading-tight ${titleColor} ${
              variant === "alert" || variant === "confirmation"
                ? "text-center"
                : ""
            }`}>
            {title}
          </h2>
          {subtitle && <p className="text-gray-600 mb-6 text-sm">{subtitle}</p>}
          {content && (
            <div
              className={`mb-4 ${
                variant === "alert" || variant === "confirmation"
                  ? "text-gray-700 text-sm text-center"
                  : ""
              }`}>
              {content}
            </div>
          )}

          {resolvedButtons.length > 0 && (
            <div
              className={buttonLayout}
              style={{ gap: isCloseDialogStyle ? "12px" : "8px" }}>
              {resolvedButtons.map(renderButton)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default Modal Layout
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-sm">
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[1001]`}
        onClick={() => closeOnOverlay && onClose()}
      />

      <div
        ref={dialogRef}
        className={`relative ${sizes[width]} bg-white rounded-xl shadow-xl p-6 text-gray-800 border border-gray-200 transform transition-all z-[1002] ${containerClassName}`}>
        {showCloseButton && (
          <div className="absolute top-1 right-1 text-xl">
            <Button
              onClick={onClose}
              btnText="✕"
              color="transparent"
              textColor="black"
              size="xxs"
            />
          </div>
        )}

        {title && (
          <h2
            className={`text-xl text-center font-semibold mt-6 mb-4 text-dark-green ${titleClassName}`}>
            {title}
          </h2>
        )}

        {content && <div className="mt-4 text-center">{content}</div>}

        {resolvedButtons.length > 0 && (
          <div className="mt-6 flex flex-col gap-2">
            {resolvedButtons.map(renderButton)}
          </div>
        )}
      </div>
    </div>
  );
}
