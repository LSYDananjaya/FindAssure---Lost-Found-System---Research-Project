import React from 'react';

interface ConfidenceStageSelectorProps {
  value: number;
  onChange: (stage: number) => void;
  label?: string;
  required?: boolean;
}

const ConfidenceStageSelector: React.FC<ConfidenceStageSelectorProps> = ({
  value,
  onChange,
  label = 'Confidence Level',
  required = false
}) => {
  const stages = [
    { value: 1, label: '😊 Pretty Sure', color: 'bg-green-100 border-green-300 hover:bg-green-200', activeColor: 'bg-green-200 border-green-500' },
    { value: 2, label: '🙂 Sure', color: 'bg-blue-100 border-blue-300 hover:bg-blue-200', activeColor: 'bg-blue-200 border-blue-500' },
    { value: 3, label: '🤔 Not Sure', color: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200', activeColor: 'bg-yellow-200 border-yellow-500' },
    { value: 4, label: '🤷 No Idea', color: 'bg-red-100 border-red-300 hover:bg-red-200', activeColor: 'bg-red-200 border-red-500' },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stages.map((stage) => (
          <button
            key={stage.value}
            type="button"
            onClick={() => onChange(stage.value)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 text-center font-medium
              ${value === stage.value ? stage.activeColor + ' shadow-md' : stage.color}
            `}
          >
            <div className="text-2xl mb-1">{stage.label.split(' ')[0]}</div>
            <div className="text-sm">{stage.label.split(' ').slice(1).join(' ')}</div>
          </button>
        ))}
      </div>
      
      {value > 0 && (
        <div className="text-sm text-gray-600">
          Selected: <span className="font-medium">{stages.find(s => s.value === value)?.label}</span>
        </div>
      )}
    </div>
  );
};

export default ConfidenceStageSelector;
