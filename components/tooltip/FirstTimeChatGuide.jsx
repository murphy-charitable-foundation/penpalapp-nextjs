import React, { useEffect, useState, useRef } from 'react';
import styles from './Tooltip.module.css';
import TemplateModal from './TemplateModal';

export default function FirstTimeChatGuide({ step, chats = [], onUseTemplate }) {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(step);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const tooltipRef = useRef(null);
  const typingTimerRef = useRef(null);

  

  const defaultTemplate = 
    `Dear Angel,
    Thank you fpr you for your tme and effort to contact me!
    I am so happy that we can communicate wth someone outside  of my village`;
  
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
      advanceOn: 'focus'
    },
    {
      target: '#message-input',
      content: 'Write the name of the person',
      position: 'top',
      arrowDirection: 'bottom',
      advanceOn: 'null',
      setupListeners: (targetElement, nextStepFn) => {
        const handleInput = () => {
          // Clear any existing timer
          if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
          }
          
          // Set a new timer - will trigger 1.5 seconds after user stops typing
          typingTimerRef.current = setTimeout(() => {
            const value = targetElement.value || targetElement.textContent;
            if (value && value.trim().length > 0) {
              // If there's actually text entered, show the template modal
              setShowTemplateModal(true);
              // Don't advance to next step yet - we'll do that after template decision
            }
          }, 1500);
        };

        targetElement.addEventListener('input', handleInput);
        return () => {
          targetElement.removeEventListener('input', handleInput);
          if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
            setCurrentStep(currentStep + 1);
          }
        };
      }
    },
    {
      target: '#use-template',
      content: 'Use the template',
      arrowDirection: 'top',
      position: 'bottom',
      advanceOn: null,
      setupListeners: () => {
        console.log('next');
      }
    },
    {
      target: '#cancle-template',
      content: 'Don\'t Use the template',
      arrowDirection: 'bottom',
      position: 'bottom',
      advanceOn: null,
    },
    {
      target: '#use-template',
      content: 'Start Typing',
      arrowDirection: 'top',
      position: 'bottom',
    },
    {
      target: '#use-template',
      content: 'When you are ready, click the button',
      arrowDirection: 'top',
      position: 'bottom',
    },
    {
      target: '#settings-button',
      content: 'Use the We have drafted a template for you to respond to your international buddy',
      position: 'left',
    },
    {
      target: '#settings-button',
      content: 'You can see your message now, how it is send',
      position: 'top',
    }
  ];

  // useEffect( () => {
  //   setShowGuide(true);
  //   setCurrentStep(step);
  // }, []);

  useEffect(() => {
    setCurrentStep(step);
    console.log(chats.length, step);
    // Check if we need to show the guide
    if (chats.length == 1 || step == 2 ) {
      setShowGuide(true);
      
      console.log(step);
      const savedStep = localStorage.getItem('chatGuideStep');
      const isGuideCompleted = localStorage.getItem('hasSeenChatGuide') === 'true';
      
      if (!isGuideCompleted) {
        // if (savedStep !== null) {
        //   setCurrentStep(parseInt(savedStep, 10));
        // }
        setShowGuide(true);
      }
    }
  }, [chats]);

  useEffect(() => {
    console.log(`show guide: ${showGuide}, current step: ${currentStep}`)
    // Save current step to localStorage whenever it changes
    // if (showGuide) {
    //   localStorage.setItem('chatGuideStep', currentStep.toString());
    // }
  }, [currentStep, showGuide]);



  useEffect(() => {
    // Set up event listeners for the current step target
    if (!showGuide || showTemplateModal) return;
    
    const currentStepData = steps[currentStep];
    const targetElement = document.querySelector(currentStepData.target);
    
    if (!targetElement) {
      setShowGuide(false);
      return;
    } 
    
    // Position the tooltip relative to the target
    positionTooltip(targetElement, currentStepData.position);
    
    let cleanupFn = () => {};
    
    // Check if step has custom listener setup
    if (currentStepData.setupListeners) {
      cleanupFn = currentStepData.setupListeners(targetElement, nextStep);
    } 
    else if (currentStepData.advanceOn) {
      // Set up event listener for the target element
      const handleTargetAction = () => {
        setCurrentStep(currentStep+1);
      };

      targetElement.addEventListener(currentStepData.advanceOn, handleTargetAction);

      cleanupFn = () => {
        targetElement.removeEventListener(currentStepData.advanceOn, handleTargetAction);
      };
    }
    
    // Clean up event listener
    return cleanupFn;
  }, [currentStep, showGuide, showTemplateModal]);

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
        top = targetRect.top - tooltipRect.height - 10;
        break;
      case 'typing-box':
        top = targetRect.top;
        left = 0;
        break;
      default:
        top = targetRect.bottom + 10;
        left = targetRect.left;
    }
    
    // Apply position
    tooltipElement.style.top = `${Math.max(10, top)}px`;
    tooltipElement.style.left = `${Math.max(10, left)}px`;
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
    setShowGuide(false);
    setShowTemplateModal(false);
    // Remember that user has seen the guide
    localStorage.setItem('hasSeenChatGuide', 'true');
    localStorage.removeItem('chatGuideStep');
  };

  const handleUseTemplate = () => {
    setShowTemplateModal(false);
    if (onUseTemplate) {
      onUseTemplate(defaultTemplate);
    }
    nextStep(); // Move to the next step after using template
  };

  const handleCancelTemplate = () => {
    setShowTemplateModal(false);
    nextStep(); // Move to the next step after canceling
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
        className={`absolute bg-[#65B427] rounded-lg p-4 shadow-lg w-max z-[51] ${styles.speechbubble} ${styles[currentStepData.arrowDirection]}`}
      >
        <p className="text-white font-medium text-center text-lg">{currentStepData.content}</p>
        <div className="flex justify-between">
          <button 
            onClick={completeGuide}
            className="px-3 py-1 text-white text-sm"
          >
            Skip
          </button>
          <button 
            onClick={nextStep} 
            className="text-white text-sm px-3 py-1 underline"
          >
            {currentStep === steps.length - 1 ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
      }

      {
        showTemplateModal && 
        <TemplateModal  
          defaultTemplate={defaultTemplate}
          onCancleClick={handleCancelTemplate}
          onUseClick={handleUseTemplate}
        />
      }
    </>
  );
}