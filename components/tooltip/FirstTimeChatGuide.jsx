import React, { useEffect, useState, useRef } from "react";
import styles from "./Tooltip.module.css";
import Button from "../general/Button";

export default function FirstTimeChatGuide({
  page,
  onUseTemplate,
  params,
  recipient,
  user,
  isDraft,
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const tooltipRef = useRef(null);
  const [buttonHighlight, setButtonHighlight] = useState(false);
  const defaultTemplate = `Dear ${recipient?.[0]?.first_name} ${recipient?.[0]?.last_name},

      I hope you find well in this e-mail.
      I'm writing to you today to share a little bit about my life.

      (share something about you, like your hobby)

      ....

      Thank you,
      (enter your name)`;

  const getStepConfig = (screenWidth, screenHeight) => {
    const isMobile = screenWidth <= 768;
    const isTablet = screenWidth > 768 && screenWidth <= 1024;
    const isDesktop = screenWidth > 1024;
    const secondStepText = isDraft ? 'Tap to reply' : 'Tap to reply and Draft your response here.';

    return [
      {
        target: ".first-letter",
        content: "Tap with your finger to open the letter",
        position: isMobile ? "bottom-center" : "bottom-left",
        arrowDirection: "top",
      },
      {
        target: "#message-input",
        content: secondStepText,
        position: isMobile ? "top-center" : "top-left",
        arrowDirection: "bottom",
        advanceOn: "click",
        showTemplateOptions: true,
      },
      {
        target: "#send-letter",
        content: "When you click this button, your letter will be sent",
        position: "send-letter",
        arrowDirection: "topRight",
      },
    ];
  };
  
  // Track screen size changes
  useEffect(() => {
    const updateScreenSize = () => {
      if (typeof window !== 'undefined') {
        const newSize = {
          width: window.innerWidth,
          height: window.innerHeight
        };
        console.log('Screen size updated:', newSize);
        setScreenSize(newSize);
      }
    };

    if (typeof window !== 'undefined') {
      updateScreenSize();
    }
      // Add resize listener with debouncing to prevent excessive calls
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateScreenSize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', updateScreenSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', updateScreenSize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const currentWidth = screenSize.width || (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const currentHeight = screenSize.height || (typeof window !== 'undefined' ? window.innerHeight : 768);
  const steps = getStepConfig(screenSize.width, screenSize.height);

  useEffect(() => {
    console.log('Current screen size:', { width: currentWidth, height: currentHeight });
  }, [currentWidth, currentHeight]);

  useEffect(() => {
    const isGuideCompleted =
      localStorage.getItem("hasSeenChatGuide") === "true";

    if (!isGuideCompleted) {
      if (page == "letterHome" || params == "/letterhome") {
        setShowGuide(true);
        setCurrentStep(0);
      } else if (page == "letterDetail" || params.includes("/letters/")) {
        setCurrentStep(1);
        setShowGuide(true);
      }
    }
  }, [page]);

  useEffect(() => {
    console.log(`show guide: ${showGuide}, current step: ${currentStep}`);
    if (currentStep === steps.length - 1) {
      setButtonHighlight(true);
    }
    // Save current step to localStorage whenever it changes
  }, [currentStep, showGuide]);

  useEffect(() => {
    // Set up event listeners for the current step target
    if (!showGuide || steps.length === 0) return;

    const currentStepData = steps[currentStep];
    const positionWithDelay = () => {
      const targetElement = document.querySelector(currentStepData.target);

      if (!targetElement) {
        console.warn(`Target element not found: ${currentStepData.target}`);

        // For the send button, try alternative selectors
        if (currentStepData.target === '#send-letter') {
          const alternatives = [
            'img[id="send-letter"]',
            'img[alt="Send message"]',
          ];

          for (const selector of alternatives) {
            const altElement = document.querySelector(selector);
            if (altElement) {
              console.log(`Found send button with alternative selector: ${selector}`);
              positionTooltip(altElement, currentStepData.position);
              return;
            }
          }
        }
        return;
      }

      console.log(`Positioning tooltip for step ${currentStep}, target: ${currentStepData.target}`);
      // Position the tooltip relative to the target
      positionTooltip(targetElement, currentStepData.position);
    };

    if (currentStep === steps.length - 1) {
      setTimeout(positionWithDelay, 100);
    } else {
      positionWithDelay();
    }

    let cleanupFn = () => {};

    // Handle template options in step 3
    if (currentStepData.showTemplateOptions) {
      setShowTemplateModal(true);
    } else {
      setShowTemplateModal(false);
    }

    if (currentStepData.advanceOn) {

      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        const handleTargetAction = () => {
          if (currentStepData.advanceOn === "click") {
            // Step 1 (index 1) is the message input step
            if (currentStep === 1 && onUseTemplate && !isDraft) {
              onUseTemplate(defaultTemplate);
            }
            targetElement.blur();
          }
          nextStep();
        };

      targetElement.addEventListener(
        currentStepData.advanceOn,
        handleTargetAction
      );

      cleanupFn = () => {
        targetElement.removeEventListener(
          currentStepData.advanceOn,
          handleTargetAction
        );
      };
    }
  }
    // Clean up event listener
    return cleanupFn;
  }, [currentStep, showGuide, currentWidth, currentHeight]);

  useEffect(() => {
    if (!showGuide || steps.length === 0) return;

    const currentStepData = steps[currentStep];
    const targetElement = document.querySelector(currentStepData.target);

    if (!targetElement || !tooltipRef.current) return;

    // Reposition tooltip when screen size changes
    const repositionTooltip = () => {
      // Small delay to ensure layout has updated
      requestAnimationFrame(() => {
        positionTooltip(targetElement, currentStepData.position);
      });
    };

    repositionTooltip();
  }, [currentWidth, currentHeight, showGuide, currentStep]);

  // Function to position tooltip relative to target element
  const positionTooltip = (targetElement, position) => {
    if (!tooltipRef.current || !targetElement) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipElement = tooltipRef.current;
    
    // Force a reflow to get accurate measurements
    tooltipElement.style.visibility = 'hidden';
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.top = '0px';
    tooltipElement.style.left = '0px';
    tooltipElement.style.right = 'unset';
    tooltipElement.style.bottom = 'unset';

    const tooltipRect = tooltipElement.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;

    const margin = isMobile ? 16 : 20;
    const arrowOffset = 12;

    // Calculate tooltip position based on target and preferred position
    let top, left, right, bottom;
    console.log('Positioning tooltip:', { position, targetRect, tooltipRect, viewportWidth, viewportHeight });

    switch (position) {
      case "top-center":
      top = Math.max(margin, targetRect.top - tooltipRect.height - arrowOffset) + "px";
      left = Math.max(margin, Math.min(
        viewportWidth - tooltipRect.width - margin,
        targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
      )) + "px";
      break;

    case "top-left":
      top = Math.max(margin, targetRect.top - tooltipRect.height - arrowOffset) + "px";
      left = Math.max(margin, targetRect.left) + "px";
      break;

    case "top-right":
      top = Math.max(margin, targetRect.top - tooltipRect.height - arrowOffset) + "px";
      right = Math.max(margin, viewportWidth - targetRect.right) + "px";
      break;

    case "send-letter":
      top = Math.max(margin, targetRect.bottom - arrowOffset) + "px";
      left = Math.max(margin, targetRect.width - tooltipRect.width + targetRect.left) + "px";
      right = Math.max(margin, viewportWidth - targetRect.right) + "px";
      break;

    case "bottom-center":
      top = Math.min(
        viewportHeight - tooltipRect.height - margin,
        targetRect.bottom + arrowOffset
      ) + "px";
      left = Math.max(margin, Math.min(
        viewportWidth - tooltipRect.width - margin,
        targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
      )) + "px";
      break;

    case "bottom-left":
      top = Math.min(
        viewportHeight - tooltipRect.height - margin,
        targetRect.bottom + arrowOffset
      ) + "px";
      left = Math.max(margin, targetRect.left) + "px";
      break;

    case "left-center":
      if (targetRect.left > tooltipRect.width + margin) {
        // Space available on left
        left = (targetRect.left - tooltipRect.width - arrowOffset) + "px";
      } else {
        // Fallback to right
        left = (targetRect.right + arrowOffset) + "px";
      }
      top = Math.max(margin, Math.min(
        viewportHeight - tooltipRect.height - margin,
        targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
      )) + "px";
      break;

    case "right-center":
      if (viewportWidth - targetRect.right > tooltipRect.width + margin) {
        // Space available on right
        left = (targetRect.right + arrowOffset) + "px";
      } else {
        // Fallback to left
        left = (targetRect.left - tooltipRect.width - arrowOffset) + "px";
      }
      top = Math.max(margin, Math.min(
        viewportHeight - tooltipRect.height - margin,
        targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
      )) + "px";
      break;

    case "auto":
      // Smart positioning - choose best position based on available space
      const spaces = {
        top: targetRect.top,
        bottom: viewportHeight - targetRect.bottom,
        left: targetRect.left,
        right: viewportWidth - targetRect.right
      };

      const maxSpace = Math.max(...Object.values(spaces));

      if (spaces.bottom === maxSpace && spaces.bottom > tooltipRect.height + margin) {
        // Position below
        top = (targetRect.bottom + arrowOffset) + "px";
        left = Math.max(margin, Math.min(
          viewportWidth - tooltipRect.width - margin,
          targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
        )) + "px";
      } else if (spaces.top === maxSpace && spaces.top > tooltipRect.height + margin) {
        // Position above
        top = (targetRect.top - tooltipRect.height - arrowOffset) + "px";
        left = Math.max(margin, Math.min(
          viewportWidth - tooltipRect.width - margin,
          targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
        )) + "px";
      } else if (spaces.right === maxSpace) {
        // Position to the right
        left = (targetRect.right + arrowOffset) + "px";
        top = Math.max(margin, Math.min(
          viewportHeight - tooltipRect.height - margin,
          targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
        )) + "px";
      } else {
        // Position to the left
        left = (targetRect.left - tooltipRect.width - arrowOffset) + "px";
        top = Math.max(margin, Math.min(
          viewportHeight - tooltipRect.height - margin,
          targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
        )) + "px";
      }
      break;

    default:
      // Fallback to auto positioning
      return positionTooltip(targetElement, "auto");
    }
    
    if (!top || top === 'undefined' || top === 'NaNpx') {
      console.error('Invalid top position calculated:', top);
      top = margin + "px";
    }
    if (!left || left === 'undefined' || left === 'NaNpx') {
      console.error('Invalid left position calculated:', left);
      left = margin + "px";
    }
    
    tooltipElement.style.visibility = 'visible';
    if (top && top !== 'unset') tooltipElement.style.top = top;
    if (left && left !== 'unset') tooltipElement.style.left = left;
    if (right && right !== 'unset') tooltipElement.style.right = right;
    if (bottom && bottom !== 'unset') tooltipElement.style.bottom = bottom;

    console.log('Applied tooltip position:', { top, left, right, bottom });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setButtonHighlight(false);
      setCurrentStep(currentStep + 1);
    } else {
      // End of guide
      setButtonHighlight(true);
      completeGuide();
    }
  };

  const completeGuide = () => {
    localStorage.setItem("hasSeenChatGuide", "true");
    setShowGuide(false);
    setButtonHighlight(false);
  };

  // If not showing guide or not a first time user, don't render anything
  if (!showGuide) {
    return null;
  }

  //console.log(user);
  const currentStepData = steps[currentStep];
  return (
    <>
      {showGuide && currentStepData && user == "child" && (
        <div
          ref={tooltipRef}
          className={`
          w-[calc(100%-2rem)] 
          absolute bg-[#65B427] 
          rounded-lg 
          p-4 
          shadow-lg 
          max-w-sm 
          z-[1]
          ${styles.speechbubble} ${styles[currentStepData.arrowDirection]}
          ${buttonHighlight && styles["button-highlight"]}
          `}>
          <p className="text-white font-medium text-left text-lg">
            {currentStepData.content}
          </p>

          {currentStep !== 0 && (
            <Button
              onClick={completeGuide}
              btnText={currentStep !== steps.length - 1 ? "Skip" : "Done" }
              size='xs'
              color='transparent'
              className="w-auto text-white px-[0px] underline"
            />
          )}
        </div>
      )}
    </>
  );
}
