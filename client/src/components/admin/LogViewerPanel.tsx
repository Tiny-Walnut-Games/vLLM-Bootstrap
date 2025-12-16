import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface Props {
  modelName: string;
  onClose: () => void;
}

export const LogViewerPanel: React.FC<Props> = ({ modelName, onClose }) => {
  const [logs, setLogs] = useState<string>('Loading logs...');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();
    
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [modelName, autoRefresh]);

  const loadLogs = async () => {
    try {
      const response = await apiClient.get(`/admin/logs/${modelName}?lines=200`);
      setLogs(response.data);
    } catch (error) {
      setLogs('Failed to load logs');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Logs: {modelName}</h3>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            
            <button
              onClick={loadLogs}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Refresh
            </button>
            
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-900 text-green-400 font-mono text-sm">
          <pre className="whitespace-pre-wrap">{logs}</pre>
        </div>
      </div>
    </div>
  );
};
