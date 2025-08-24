/**
 * // ===== USAGE EXAMPLES FOR THE NEW MODAL COMPONENT =====

// 1. CLOSE DIALOG (your current use case) - Legacy support
<Modal
  isOpen={showCloseDialog}
  onClose={() => setShowCloseDialog(false)}
  isCloseDialog={true}
  title="Close this message?"
  subtitle="Your message will be saved as a draft."
  primaryButtonText="Stay on page"
  secondaryButtonText="Close"
  onPrimaryAction={handleContinueEditing}
  onSecondaryAction={handleConfirmClose}
  closeOnOverlay={false}
  showCloseButton={false}
/>

// 2. CLOSE DIALOG (new flexible way)
<Modal
  isOpen={showCloseDialog}
  onClose={() => setShowCloseDialog(false)}
  variant="closeDialog"
  title="Close this message?"
  subtitle="Your message will be saved as a draft."
  buttons={[
    {
      text: "Stay on page",
      onClick: handleContinueEditing,
      variant: "primary",
      className: "flex-1"
    },
    {
      text: "Close",
      onClick: handleConfirmClose,
      variant: "secondary",
      className: "flex-1"
    }
  ]}
  closeOnOverlay={false}
  showCloseButton={false}
/>

// 3. CONFIRMATION DIALOG (like ReportPopup)
<Modal
  isOpen={showReportDialog}
  onClose={() => setShowReportDialog(false)}
  variant="confirmation"
  title="Are you sure that you want to report this letter?"
  content="This action will not be undone afterwards."
  titleClassName="text-red-500"
  buttons={[
    {
      text: "Cancel",
      onClick: () => setShowReportDialog(false),
      variant: "secondary",
      className: "flex-1"
    },
    {
      text: "Report",
      onClick: handleReport,
      variant: "primary",
      className: "flex-1"
    }
  ]}
/>

// 4. SUCCESS ALERT (like ConfirmReportPopup)
<Modal
  isOpen={showSuccessAlert}
  onClose={() => setShowSuccessAlert(false)}
  variant="alert"
  title="Was Successful"
  titleClassName="text-green-700"
  content={
    <>
      <FaExclamationCircle className="text-green-700 h-10 w-10 mx-auto mb-2" />
      <p>Thank you for reporting the inappropriate message. We greatly appreciate your feedback, as it helps us improve. Our team will review the content of the message.</p>
    </>
  }
  buttons={[
    {
      text: "Got It",
      onClick: () => setShowSuccessAlert(false),
      variant: "primary"
    }
  ]}
/>

// 5. CUSTOM DIALOG with multiple buttons
<Modal
  isOpen={showCustomDialog}
  onClose={() => setShowCustomDialog(false)}
  title="Choose an action"
  content="What would you like to do with this item?"
  buttons={[
    {
      text: "Edit",
      onClick: handleEdit,
      variant: "primary"
    },
    {
      text: "Delete",
      onClick: handleDelete,
      variant: "danger"
    },
    {
      text: "Cancel",
      onClick: () => setShowCustomDialog(false),
      variant: "secondary"
    }
  ]}
/>

// 6. DEFAULT MODAL (your existing functionality)
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
  content={<div>Custom content here</div>}
/>

// ===== BUTTON VARIANTS AVAILABLE =====
// - primary: Green background (#4E802A) with white text
// - secondary: Gray background with green text (#4E802A)  
// - danger: Red background with white text
// You can add more variants to the buttonVariants object in Modal.jsx

// ===== LAYOUT VARIANTS =====
// - default: Standard modal layout
// - closeDialog: Your current close dialog style
// - alert: Centered content with icon support
// - confirmation: Two-button confirmation style
 */

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

  // Close Dialog Layout (legacy support)
  if (isCloseDialog || variant === "closeDialog") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
        <div
          className={`bg-gray-100 p-6 rounded-2xl shadow-lg w-[345px] h-[245px] mx-auto ${containerClassName}`}>
          <h2
            className={`text-xl font-semibold mb-1 text-black leading-tight ${titleClassName}`}>
            {title}
          </h2>
          {subtitle && <p className="text-gray-600 mb-6 text-sm">{subtitle}</p>}
          {content && <div className="mb-4">{content}</div>}

          {resolvedButtons.length > 0 && (
            <div className="flex space-x-3">
              {resolvedButtons.map(renderButton)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Alert/Confirmation Layout
  if (variant === "alert" || variant === "confirmation") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <div
          className={`bg-white space-y-4 shadow-md w-[300px] rounded-md p-4 flex flex-col items-center ${containerClassName}`}>
          {title && (
            <h1 className={`font-semibold text-sm ${titleClassName}`}>
              {title}
            </h1>
          )}
          {content && (
            <div className="text-gray-700 text-sm text-center">{content}</div>
          )}

          {resolvedButtons.length > 0 && (
            <div className="flex justify-between gap-2 w-full">
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
