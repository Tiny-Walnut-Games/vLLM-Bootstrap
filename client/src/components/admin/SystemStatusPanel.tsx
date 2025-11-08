import React, { useState } from 'react';
import { SystemStatus } from '../../pages/AdminDashboard';

interface Props {
  status: SystemStatus | null;
  onInstallWSL: () => void;
  onBootstrapVLLM: () => void;
  onAuthenticateHF: (token: string) => void;
}

export const SystemStatusPanel: React.FC<Props> = ({ status, onInstallWSL, onBootstrapVLLM, onAuthenticateHF }) => {
  const [hfToken, setHfToken] = useState('');
  const [showHfInput, setShowHfInput] = useState(false);
  
  if (!status) return null;

  const StatusItem = ({ 
    label, 
    installed, 
    version, 
    onAction 
  }: { 
    label: string; 
    installed: boolean; 
    version?: string; 
    onAction?: () => void 
  }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${installed ? 'bg-green-500' : 'bg-red-500'}`} />
        <div>
          <div className="font-medium text-gray-900">{label}</div>
          {version && <div className="text-sm text-gray-600">{version}</div>}
        </div>
      </div>
      {!installed && onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Install
        </button>
      )}
    </div>
  );

  const allInstalled = status.node.installed && status.wsl.installed && 
                       status.python.installed && status.vllm.installed && 
                       status.huggingface?.authenticated;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">System Status</h2>
      
      <div className="space-y-3 mb-4">
        <StatusItem
          label="Node.js"
          installed={status.node.installed}
          version={status.node.version}
        />
        
        <StatusItem
          label="WSL"
          installed={status.wsl.installed}
          version={status.wsl.distribution}
          onAction={onInstallWSL}
        />
        
        <StatusItem
          label="Python"
          installed={status.python.installed}
          version={status.python.version}
        />
        
        <StatusItem
          label="vLLM"
          installed={status.vllm.installed}
          version={status.vllm.version}
          onAction={onBootstrapVLLM}
        />

        <div className="p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.huggingface?.authenticated ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <div className="font-medium text-gray-900">HuggingFace</div>
                {status.huggingface?.username && (
                  <div className="text-sm text-gray-600">{status.huggingface.username}</div>
                )}
              </div>
            </div>
            {!status.huggingface?.authenticated && (
              <button
                onClick={() => setShowHfInput(!showHfInput)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {showHfInput ? 'Cancel' : 'Login'}
              </button>
            )}
          </div>
          
          {showHfInput && (
            <div className="mt-3 flex gap-2">
              <input
                type="password"
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                placeholder="Enter HuggingFace token"
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => {
                  onAuthenticateHF(hfToken);
                  setHfToken('');
                  setShowHfInput(false);
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!hfToken}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>

      {allInstalled && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <div className="text-green-800 font-medium">✓ System ready!</div>
          <div className="text-sm text-green-700 mt-1">
            All prerequisites are installed and configured.
          </div>
        </div>
      )}

      {!status.vllm.installed && status.wsl.installed && status.python.installed && (
        <button
          onClick={onBootstrapVLLM}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Run vLLM Bootstrap
        </button>
      )}
    </div>
  );
};
