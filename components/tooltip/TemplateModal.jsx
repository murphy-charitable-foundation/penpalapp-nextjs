import React from 'react';
import styles from './Tooltip.module.css';

export default function TemplateModal({ defaultTemplate, onCancleClick, onUseClick }) {
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg w-full">
          <h3 className="text-lg font-medium mb-4">New Message</h3>
          
          <div className="mb-6 p-4 border border-gray-200 rounded bg-gray-50">
            <p className="text-gray-700">{defaultTemplate}</p>
            
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
                id="cancle-template"
                onClick={onCancleClick}
                className="px-4 py-2 border border-gray-300 rounded"
            >
              Cancel Template
            </button>
            <button
                id="use-template"
                onClick={onUseClick}
                className={`px-4 py-2 text-white rounded ${styles['medium-green-btn']}`}
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    );
}
