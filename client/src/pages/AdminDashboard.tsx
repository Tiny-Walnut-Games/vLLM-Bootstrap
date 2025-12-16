import React, { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { SystemStatusPanel } from '../components/admin/SystemStatusPanel';
import { ModelManagementPanel } from '../components/admin/ModelManagementPanel';
import { ModelConfigurationPanel } from '../components/admin/ModelConfigurationPanel';
import { HFAuthPanel } from '../components/admin/HFAuthPanel';
import { ModeToggle } from '../components/admin/ModeToggle';
import { LogViewerPanel } from '../components/admin/LogViewerPanel';
import { TerminalPanel } from '../components/admin/TerminalPanel';
import { apiClient } from '../api/client';

export interface SystemStatus {
  node: { installed: boolean; version?: string };
  wsl: { installed: boolean; distribution?: string };
  python: { installed: boolean; version?: string };
  vllm: { installed: boolean; version?: string };
  huggingface?: { authenticated: boolean; username?: string };
}

export interface ModelStatus {
  name: string;
  role: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  port?: number;
  pid?: number;
  uptime?: number;
}

export const AdminDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [mode, setMode] = useState<'IDE_ONLY' | 'GUI_CHAT'>('GUI_CHAT');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);



  const loadDashboardData = async () => {
    try {
      setError(null);
      const [statusRes, modelsRes, modeRes] = await Promise.all([
        apiClient.get('/admin/system/status'),
        apiClient.get('/admin/models/status'),
        apiClient.get('/admin/mode')
      ]);

      setSystemStatus(statusRes.data);
      setModels(modelsRes.data);
      setMode(modeRes.data.mode);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setError(error?.response?.data?.error || error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallWSL = async () => {
    try {
      setError(null);
      const response = await apiClient.post('/admin/wsl/install');
      console.log('WSL install response:', response.data);
      alert('WSL installation initiated. Please check system status.');
      loadDashboardData();
    } catch (error: any) {
      console.error('WSL install error:', error);
      const errorMsg = error?.response?.data?.error || error.message || 'Failed to install WSL';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const handleBootstrapVLLM = async () => {
    try {
      setError(null);
      const response = await apiClient.post('/admin/vllm/bootstrap');
      console.log('Bootstrap response:', response.data);
      alert('vLLM bootstrap started. This may take several minutes.');
      loadDashboardData();
    } catch (error: any) {
      console.error('Bootstrap error:', error);
      const errorMsg = error?.response?.data?.error || error.message || 'Failed to start bootstrap';
      setError(errorMsg);
      alert(errorMsg);
    }
  };



  const handleAuthenticateHF = async (token: string) => {
    try {
      setError(null);
      console.log('Authenticating with HuggingFace...');
      const response = await apiClient.post('/admin/hf/auth/login', { token });
      console.log('HF auth response:', response.data);
      if (response.data.success) {
        alert('Successfully authenticated with HuggingFace!');
        await new Promise(resolve => setTimeout(resolve, 1500));
        loadDashboardData();
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('HF auth error:', error);
      const errorMsg = error?.response?.data?.error || error.message || 'Failed to authenticate with HuggingFace';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const handleStartModel = async (role: string) => {
    try {
      setError(null);
      console.log(`Starting model for role: ${role}`);
      const configRes = await apiClient.get('/admin/models/config');
      const config = configRes.data;
      const roleConfig = config[role];
      const modelName = roleConfig?.model || role;
      const response = await apiClient.post(`/admin/models/${role}/start`, { modelName });
      console.log('Start model response:', response.data);
      alert(`Model ${role} is starting. Download may take several minutes.`);
    } catch (error: any) {
      console.error('Start model error:', error);
      const errorMsg = error?.response?.data?.error || error.message || `Failed to start model: ${role}`;
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const handleStopModel = async (role: string) => {
    try {
      setError(null);
      console.log(`Stopping model for role: ${role}`);
      const response = await apiClient.post(`/admin/models/${role}/stop`);
      console.log('Stop model response:', response.data);
      alert(`Model ${role} stopping...`);
    } catch (error: any) {
      console.error('Stop model error:', error);
      const errorMsg = error?.response?.data?.error || error.message || `Failed to stop model: ${role}`;
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const handleToggleMode = async () => {
    try {
      setError(null);
      const newMode = mode === 'IDE_ONLY' ? 'GUI_CHAT' : 'IDE_ONLY';
      console.log(`Toggling mode to: ${newMode}`);
      const response = await apiClient.post('/admin/mode/toggle', { mode: newMode });
      console.log('Mode toggle response:', response.data);
      setMode(newMode);
      alert(`Switched to ${newMode} mode`);
    } catch (error: any) {
      console.error('Mode toggle error:', error);
      const errorMsg = error?.response?.data?.error || error.message || 'Failed to toggle mode';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your vLLM installation and models</p>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SystemStatusPanel
            status={systemStatus}
            onInstallWSL={handleInstallWSL}
            onBootstrapVLLM={handleBootstrapVLLM}
            onAuthenticateHF={handleAuthenticateHF}
          />

          <div className="space-y-4">
            <ModeToggle
              currentMode={mode}
              onToggle={handleToggleMode}
            />
            
            <button
              onClick={() => setShowTerminal(true)}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium flex items-center justify-center gap-2"
            >
              <span>🖥️</span>
              Open Server Terminal
            </button>
          </div>
        </div>

        <ModelManagementPanel
          models={models}
          onStart={handleStartModel}
          onStop={handleStopModel}
          onViewLogs={setSelectedModel}
        />

        <HFAuthPanel onTokenUpdated={loadDashboardData} />

        <ModelConfigurationPanel onConfigUpdated={loadDashboardData} />

        {selectedModel && (
          <LogViewerPanel
            modelName={selectedModel}
            onClose={() => setSelectedModel(null)}
          />
        )}

        {showTerminal && (
          <TerminalPanel onClose={() => setShowTerminal(false)} />
        )}
        </div>
      </div>
    </>
  );
};
