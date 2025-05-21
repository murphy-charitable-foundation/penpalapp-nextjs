"use client";
import Modal from './Modal';
import List from './List';
import Button from './Button';
import { useState } from 'react';

export default function Dropdown({
  options,
  valueChange,
  currentValue,
  text, 

}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const modalContent = (
        <div className="space-y-4">
            <List 
            options={options}
            valueChange={(option) => {valueChange(option);}}
            closeList={() => {setIsModalOpen(false);}}
            currentValue={currentValue}
            />     
        </div>
    );

  return (
    <>

        <button
            onClick={() => setIsModalOpen(true)}
            className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 p-2 text-left flex justify-between items-center"
        >
            <span>{currentValue || `Select ${text}`}</span>
            <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </button>

        <Modal
        isOpen={isModalOpen} 
        onClose={() => {setIsModalOpen(false);}}
        title={text}
        content={modalContent}
        width="large"
        />
    </>
  );
}
