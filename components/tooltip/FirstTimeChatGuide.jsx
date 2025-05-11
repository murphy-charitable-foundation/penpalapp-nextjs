import React, { useEffect, useState, useRef } from 'react';
import styles from './Tooltip.module.css';

export default function FirstTimeChatGuide({ page, onUseTemplate }) {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const tooltipRef = useRef(null);

  const defaultTemplate = 
    `Dear Angel,

      I hope you find well in this e-mail.
      Suscipit ullamcorper leo mi egestas elementum orci 

      (share something about you, like your hobby) condimentum cursus phasellus turpis.
      Lorem ipsum dolor sit amet consectetur. 

      ....

      Thank you,
      (enter your name)`;
  
  const steps = [
    {
      target: '.first-letter',
      content: 'Tap with your finger to open the letter ',
      position: 'first-letter', // @todo: change this to array?
      arrowDirection: 'top',
      //advanceOn: 'click', // The event on the target that will advance the tour
    },
    {
      target: '#message-input',
      content: 'Tap to reply',
      position: 'typing-box',
      arrowDirection: 'bottom',
      advanceOn: 'focus',
    },
    {
      target: '#message-input',
      content: 'Draft your response here. Here is a sample template on how to structure a letter response',
      position: 'middle',
      arrowDirection: 'top',
      advanceOn: 'focus',
      showTemplateOptions: true,
    },
    {
      target: '#message-input',
      content: 'Use the keyboard to type. Ask for help if needed',
      position: 'middle',
      arrowDirection: 'top',
      advanceOn: 'focus',
    },
    {
      target: '.send-letter',
      content: 'You can see your message now, how it is send',
      position: 'send-letter',
      arrowDirection: 'topRight',
    }
  ];


  useEffect(() => {
    const isGuideCompleted = localStorage.getItem('hasSeenChatGuide') === 'true';

    if( !isGuideCompleted ) {
      if( page == 'letterHome' ) {
        setShowGuide(true);
        setCurrentStep(0);
      } else if( page == 'letterDetail' ) {
        setCurrentStep(1);
        setShowGuide(true);
      }
    }
  }, [page]);


  useEffect(() => {
    console.log(`show guide: ${showGuide}, current step: ${currentStep}`)
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

    // Handle template options in step 3
    if (currentStepData.showTemplateOptions) {
      setShowTemplateModal(true);
    } else {
      setShowTemplateModal(false);
    }

    if (currentStepData.advanceOn) {
      const handleTargetAction = () => {
        if (currentStepData.advanceOn === 'focus' ) {
          // When the textarea is focused, automatically use the template
          // This is the "Tap to reply" step
          // Apply template on focus
          if( currentStep === 1 && onUseTemplate ) {
            onUseTemplate(defaultTemplate);
          }
          targetElement.blur();
        }
        nextStep();
      };

      targetElement.addEventListener(currentStepData.advanceOn, handleTargetAction);

      cleanupFn = () => {
        targetElement.removeEventListener(currentStepData.advanceOn, handleTargetAction);
      };
    }
    
    // Clean up event listener
    return cleanupFn;
  }, [currentStep, showGuide]);

  // Function to position tooltip relative to target element
  const positionTooltip = (targetElement, position) => {
    if (!tooltipRef.current || !targetElement) return;
    console.log(targetElement);
    
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipElement = tooltipRef.current;
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    // Calculate tooltip position based on target and preferred position
    let top, left, right, bottom;
    console.log(targetRect);
    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 10;
        //left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 10;
        //left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 10;
        break;
      case 'right':
        top = targetRect.top + tooltipRect.height;
        //left = targetRect.right + 10;
        break;
      case 'first-letter':
        top = targetRect.bottom + 10;
        break;
      case 'typing-box':
        top = targetRect.top;
        left = 0;
        break;
      case 'middle':
        top = targetRect.top + ( targetRect.height / 2 );
        left = 0;
        break;
      case 'send-letter':
        top = targetRect.bottom;
        left = 'unset';
        right = 0;
        break;
      default:
        top = targetRect.bottom + 10;
        left = targetRect.left;
    }
    
    // Apply position
    tooltipElement.style.top = `${Math.max(10, top)}px`;
    tooltipElement.style.left = isNaN(left) ? left : `${Math.max(10, left)}px`;
    tooltipElement.style.right = `${Math.max(10, right)}px`;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // End of guide
      completeGuide();
    }
  };

  const completeGuide = () => {
    localStorage.setItem('hasSeenChatGuide', 'true');
    setShowGuide(false);
  };

  const handleUseTemplate = () => {
    console.log('saasada');
    if (onUseTemplate) {
      onUseTemplate(defaultTemplate);
    }
    
    nextStep(); // Move to the next step after using template
  };

  // If not showing guide or not a first time user, don't render anything
  if (!showGuide) {
    return null;
  }

  const currentStepData = steps[currentStep];
  
  return (
    <>
      { showGuide && currentStepData &&
      <div 
        ref={tooltipRef}
        className={
          `w-[calc(100%-2rem)] 
          absolute bg-[#65B427] 
          rounded-lg 
          p-4 s
          hadow-lg 
          max-w-sm 
          z-[51]
          ${styles.speechbubble} ${styles[currentStepData.arrowDirection]}`
        }
      >
        <p className="text-white font-medium text-left text-lg">{currentStepData.content}</p>
        
        <button 
          onClick={nextStep} 
          className="text-white text-sm pt-3 underline"
        >
          {currentStep !== steps.length - 1 ? 'Skip' : 'Done'}
        </button>
      </div>
      }

      
    </>
  );
}