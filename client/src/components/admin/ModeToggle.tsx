import React from 'react';

interface Props {
  currentMode: 'IDE_ONLY' | 'GUI_CHAT';
  onToggle: () => void;
}

export const ModeToggle: React.FC<Props> = ({ currentMode, onToggle }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Operation Mode</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border-2 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">Current Mode</div>
            <div className="text-sm text-gray-600 mt-1">
              {currentMode === 'IDE_ONLY' 
                ? 'IDE Only - vLLM running for IDE integration' 
                : 'GUI Chat - vLLM + web chat interface enabled'}
            </div>
          </div>
          
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Switch to {currentMode === 'IDE_ONLY' ? 'GUI Chat' : 'IDE Only'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className={`p-4 border-2 rounded ${
            currentMode === 'IDE_ONLY' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <h3 className="font-medium mb-2">IDE Only Mode</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ vLLM server running</li>
              <li>✓ OpenAI API compatible</li>
              <li>✓ Lightweight</li>
              <li>✗ No web chat UI</li>
            </ul>
          </div>

          <div className={`p-4 border-2 rounded ${
            currentMode === 'GUI_CHAT' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <h3 className="font-medium mb-2">GUI Chat Mode</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ vLLM server running</li>
              <li>✓ Web chat interface</li>
              <li>✓ Authentication</li>
              <li>✓ Full features</li>
            </ul>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm text-blue-800">
            <strong>Tip:</strong> Use IDE Only mode for minimal overhead when using JetBrains Rider or other IDEs.
            Switch to GUI Chat mode when you want to interact directly through the browser.
          </div>
        </div>
      </div>
    </div>
  );
};
