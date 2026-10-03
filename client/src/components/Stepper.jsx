import React from 'react';
import { Check } from 'lucide-react';

export default function Stepper({ currentStep = 1 }) {
  const steps = [
    { number: 1, label: 'Upload Excel' },
    { number: 2, label: 'Validate' },
    { number: 3, label: 'Preview' },
    { number: 4, label: 'Confirm' },
    { number: 5, label: 'Sending' },
    { number: 6, label: 'Report' },
  ];

  return (
    <nav className="w-full bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <React.Fragment key={step.number}>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow'
                      : isCurrent
                      ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-600 font-extrabold'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>
                <span
                  className={`text-xs font-semibold hidden md:inline ${
                    isCurrent ? 'text-emerald-700 font-bold' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition ${
                    isCompleted ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
