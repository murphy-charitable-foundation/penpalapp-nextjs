import React, { useEffect, useState, useRef } from "react";
import styles from "./Tooltip.module.css";

export default function FirstTimeChatGuide({
  page,
  onUseTemplate,
  params,
  recipient,
  user,
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const tooltipRef = useRef(null);
  const [buttonHighlight, setButtonHighlight] = useState(false);
  const defaultTemplate = `Dear ${recipient?.[0]?.first_name} ${recipient?.[0]?.last_name},

      I hope you find well in this e-mail.
      I'm writing to you today to share a little bit about my life.

      (share something about you, like your hobby)

      ....

      Thank you,
      (enter your name)`;

  const steps = [
    {
      target: ".first-letter",
      content: "Tap with your finger to open the letter ",
      position: "first-letter", // @todo: change this to array?
      arrowDirection: "top",
      //advanceOn: 'click', // The event on the target that will advance the tour
    },
    {
      target: "#message-input",
      content: "Tap to reply and Draft your response here.",
      position: "typing-box",
      arrowDirection: "bottom",
      advanceOn: "click",
      showTemplateOptions: true,
    },
    // {
    //   target: '#message-input',
    //   content: 'Draft your response here. Here is a sample template on how to structure a letter response',
    //   position: 'typing-box',
    //   arrowDirection: 'bottom',
    //   advanceOn: 'focus',
    //   showTemplateOptions: true,
    // },
    // {
    //   target: '.send-letter',
    //   content: 'You can see your message now, how it is send',
    //   position: 'send-letter',
    //   arrowDirection: 'topRight',
    // }
    {
      target: "#send-letter",
      content: "When you click this button, your letter will be sent",
      position: "send-letter",
      arrowDirection: "topRight",
    },
  ];

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
    if (!showGuide) return;

    const currentStepData = steps[currentStep];
    const targetElement = document.querySelector(currentStepData.target);

    if (!targetElement) {
      console.warn(`Target element not found: ${currentStepData.target}`);
      return;
    }

    // Position the tooltip relative to the target
    positionTooltip(targetElement, currentStepData.position);

    let cleanupFn = () => {};

    if (currentStepData.advanceOn) {
      console.log("test");
      const handleTargetAction = () => {
        if (currentStepData.advanceOn === "click") {
          // When the textarea is focused, automatically use the template
          // This is the "Tap to reply" step
          // Apply template on focus
          if (currentStep === 1 && onUseTemplate) {
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

    // Clean up event listener
    return cleanupFn;
  }, [currentStep, showGuide]);

  // Function to position tooltip relative to target element
  const positionTooltip = (targetElement, position) => {
    if (!tooltipRef.current || !targetElement) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipElement = tooltipRef.current;
    const tooltipRect = tooltipElement.getBoundingClientRect();

    // Calculate tooltip position based on target and preferred position
    let top, left, right, bottom;
    console.log(targetRect);
    switch (position) {
      case "top":
        top = targetRect.top - tooltipRect.height - 10 + "px";
        //left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case "bottom":
        bottom = 10 + "px";
        top = "unset";
        left = 10 + "px";
        //top = targetRect.bottom + 10;
        //left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - 10;
        break;
      case "right":
        top = targetRect.top + tooltipRect.height;
        //left = targetRect.right + 10;
        break;
      case "first-letter":
        top = targetRect.bottom + "px";
        left = targetRect.left + 20 + "px";
        break;
      case "typing-box":
        top = targetRect.top - targetRect.height + 30 + "px";
        left = 10 + "px";
        break;
      case "middle":
        top = targetRect.top + 30 + "px";
        left = 70 + "px";
        bottom = "unset";
        break;
      case "send-letter":
        top = targetRect.bottom - 10 + "px";
        left = "unset";
        right = 0;
        break;
      default:
        top = targetRect.bottom + 10;
        left = targetRect.left;
    }
    // Apply position
    tooltipElement.style.top = top;
    tooltipElement.style.left = left;
    tooltipElement.style.right = right;
    tooltipElement.style.bottom = bottom;
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

  const handleUseTemplate = () => {
    console.log("saasada");
    if (onUseTemplate) {
      onUseTemplate(defaultTemplate);
    }

    nextStep(); // Move to the next step after using template
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
            <button
              onClick={completeGuide}
              className="text-white text-sm pt-3 underline">
              {currentStep !== steps.length - 1 ? "Skip" : "Done"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
