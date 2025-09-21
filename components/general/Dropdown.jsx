"use client";
import Modal from './Dialog';
import List from './List';
import { useState } from 'react';

export default function Dropdown({
  options,
  valueChange,
  currentValue,
  text, 
  error
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const modalContent = (
        <div className="space-y-4">
            <List 
            options={options}
            valueChange={(option) => {
                valueChange(option);}}
            closeList={() => {
                setIsModalOpen(false);}}
            currentValue={currentValue}
            />     
        </div>
    );

  return (
    <>

        <button
            onClick={(e) => {
                e.preventDefault();
                setIsModalOpen(true)}}
            className={`w-full font-medium text-gray-900 bg-transparent border-b ${error ? "border-red-500" : "border-gray-300"} p-2 text-left flex justify-between items-center`}
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
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        <Dialog
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);}}
        title={text}
        content={modalContent}
        width="large"
        />
    </>
  );
}
