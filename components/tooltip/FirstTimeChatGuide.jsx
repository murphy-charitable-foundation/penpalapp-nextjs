import React, { useEffect, useState, useRef } from 'react';
import styles from './Tooltip.module.css';

export default function FirstTimeChatGuide({ messages = [], hasReplied = false }) {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const tooltipRef = useRef(null);

  const messageTemplates = [
    "Hi there! I've reviewed your request and would like to help you with this issue.",
    "Hello! Thanks for reaching out. I understand you need assistance with this matter.",
    "Good day! I appreciate your patience. Let me address your concerns."
  ];
  
  console.log(hasReplied);
  const steps = [
    {
      target: '.first-letter',
      content: 'Tap with your finger to open the letter ',
      position: 'right', // @todo: change this to array?
      arrowDirection: 'top',
      action: 'click',
      advanceOn: 'click', // The event on the target that will advance the tour
    },
    {
      target: '#message-input',
      content: 'Tap to reply',
      position: 'top',
      arrowDirection: 'bottom',
      action: 'focus',
      advanceOn: 'focus'
    },
    {
      target: '#message-input',
      content: 'Write the name of the person',
      position: 'top',
      arrowDirection: 'bottom',
      action: 'input',
      advanceOn: 'input'
    },
    {
      target: '#settings-button',
      content: 'Use the template',
      position: 'left',
      arrowDirection: 'top',
      action: 'click',
      advanceOn: 'click'
    }
  ];

  useEffect(() => {
    if (messages.length > 0 && !hasReplied) {
      // Check if we've already dismissed this guide before
      const savedStep = localStorage.getItem('chatGuideStep');
      const isGuideCompleted = localStorage.getItem('hasSeenChatGuide') === 'true';
      
      if (!isGuideCompleted) {
        if (savedStep !== null) {
          setCurrentStep(parseInt(savedStep, 10));
        }
        setShowGuide(true);
      }
    }
  }, [messages, hasReplied]);

  useEffect(() => {
    // Save current step to localStorage whenever it changes
    if (showGuide) {
      localStorage.setItem('chatGuideStep', currentStep.toString());
    }
  }, [currentStep, showGuide]);

  useEffect(() => {
    // Set up event listeners for the current step target
    if (!showGuide) return;
    
    const currentStepData = steps[currentStep];
    const targetElement = document.querySelector(currentStepData.target);
    
    if (!targetElement) return;
    
    // Position the tooltip relative to the target
    positionTooltip(targetElement, currentStepData.position);
    
    // Set up event listener for the target element
    const handleTargetAction = () => {
      nextStep();
    };
    
    targetElement.addEventListener(currentStepData.advanceOn, handleTargetAction);
    
    // Clean up event listener
    return () => {
      targetElement.removeEventListener(currentStepData.advanceOn, handleTargetAction);
    };
  }, [currentStep, showGuide]);

  // Function to position tooltip relative to target element
  const positionTooltip = (targetElement, position) => {
    if (!tooltipRef.current || !targetElement) return;
    
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipElement = tooltipRef.current;
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    // Calculate tooltip position based on target and preferred position
    let top, left;
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
      onUseTemplate(selectedTemplate);
    }
    nextStep(); // Move to the next step after using template
  };

  const handleCancelTemplate = () => {
    setShowTemplateModal(false);
    nextStep(); // Move to the next step after canceling
  };

  // If not showing guide or not a first time user, don't render anything
  if (!showGuide && !showTemplateModal) {
    return null;
  }

  const currentStepData = showGuide ? steps[currentStep] : null;


  // Template Modal Component
  const TemplateModal = () => {
    if (!showTemplateModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg w-full">
          <h3 className="text-lg font-medium mb-4">Choose a Message Template</h3>
          
          <div className="mb-4">
            <textarea 
              className="w-full border border-gray-300 rounded p-3 h-32"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              placeholder="Select a template or write your own message"
            />
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Quick templates:</p>
            <div className="space-y-2">
              {messageTemplates.map((template, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedTemplate(template)}
                  className="cursor-pointer p-2 hover:bg-gray-100 rounded border border-gray-200"
                >
                  {template.length > 60 ? template.substring(0, 60) + "..." : template}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              onClick={handleCancelTemplate}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Cancel Template
            </button>
            <button 
              onClick={handleUseTemplate}
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={!selectedTemplate.trim()}
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {showGuide && currentStepData && (
      <div 
        ref={tooltipRef}
        className={`absolute bg-[#65B427] rounded-lg p-4 shadow-lg w-max z-50 ${styles.speechbubble} ${styles[currentStepData.arrowDirection]}`}
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
      )}
    </>
  );
}