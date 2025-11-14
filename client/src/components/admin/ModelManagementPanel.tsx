import React from 'react';
import { ModelStatus } from '../../pages/AdminDashboard';

interface Props {
  models: ModelStatus[];
  onStart: (role: string) => void;
  onStop: (role: string) => void;
  onViewLogs: (modelName: string) => void;
}

export const ModelManagementPanel: React.FC<Props> = ({ models, onStart, onStop, onViewLogs }) => {
  const commonRoles = ['fast', 'edit', 'qa', 'plan'];
  
  const getRoleLabel = (role: string): string => {
    const labels: { [key: string]: string } = {
      fast: 'Fast (1B)',
      edit: 'Edit (4B)',
      qa: 'QA (7B)',
      plan: 'Plan (15B)'
    };
    return labels[role] || role;
  };
  
  const getModelStatus = (role: string) => {
    return models.find(m => m.role === role);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Model Management</h2>
      
      <div className="space-y-3">
        {commonRoles.map(role => {
          const model = getModelStatus(role);
          const isRunning = model?.status === 'running';
          const isStarting = model?.status === 'starting';

          return (
            <div key={role} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  isRunning ? 'bg-green-500' : 
                  isStarting ? 'bg-yellow-500' : 
                  'bg-gray-300'
                }`} />
                
                <div>
                  <div className="font-medium text-gray-900">{getRoleLabel(role)} Model</div>
                  <div className="text-sm text-gray-600">
                    {model ? (
                      <>
                        Port: {model.port || 'N/A'} | 
                        Status: {model.status}
                        {model.uptime && ` | Uptime: ${Math.floor(model.uptime / 60)}m`}
                      </>
                    ) : (
                      'Not running'
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!isRunning && !isStarting && (
                  <button
                    onClick={() => onStart(role)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Start
                  </button>
                )}
                
                {(isRunning || isStarting) && (
                  <>
                    <button
                      onClick={() => onStop(role)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Stop
                    </button>
                    <button
                      onClick={() => onViewLogs(role)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Logs
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {models.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No models running. Start a model above.
        </div>
      )}
    </div>
  );
};
