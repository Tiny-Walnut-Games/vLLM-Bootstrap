import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface ModelConfig {
  tier: string;
  model: string;
  token?: string;
}

interface AvailableModels {
  tiers: string[];
  modelsByTier: {
    [tier: string]: {
      default: string;
      alt1?: string;
      alt2?: string;
    };
  };
}

interface Props {
  onConfigUpdated?: () => void;
}

export const ModelConfigurationPanel: React.FC<Props> = ({ onConfigUpdated }) => {
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [roleConfigs, setRoleConfigs] = useState<{ [role: string]: ModelConfig }>({});
  const [selectedRole, setSelectedRole] = useState<string>('qa');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modelsRes, configRes] = await Promise.all([
        apiClient.get('/admin/models/available'),
        apiClient.get('/admin/models/config')
      ]);
      
      setAvailableModels(modelsRes.data);
      setRoleConfigs(configRes.data || {});
      
      if (configRes.data && configRes.data[selectedRole]) {
        const config = configRes.data[selectedRole];
        setSelectedTier(config.tier);
        setSelectedModel(config.model);
        setToken(config.token || '');
      }
    } catch (err) {
      console.error('Failed to load model configuration:', err);
      setError('Failed to load model configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    if (roleConfigs[role]) {
      const config = roleConfigs[role];
      setSelectedTier(config.tier);
      setSelectedModel(config.model);
      setToken(config.token || '');
      setCustomModel('');
    } else {
      setSelectedTier('');
      setSelectedModel('');
      setToken('');
      setCustomModel('');
    }
  };

  const handleTierChange = (tier: string) => {
    setSelectedTier(tier);
    if (availableModels?.modelsByTier[tier]) {
      setSelectedModel(availableModels.modelsByTier[tier].default);
    }
    setCustomModel('');
  };

  const handleModelChange = (model: string) => {
    if (model === '__custom__') {
      setSelectedModel('');
      setCustomModel('');
    } else {
      setSelectedModel(model);
      setCustomModel('');
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      const modelName = customModel || selectedModel;
      if (!modelName) {
        setError('Please select or enter a model name');
        return;
      }

      await apiClient.post('/admin/models/config', {
        role: selectedRole,
        tier: selectedTier,
        model: modelName,
        token: token || undefined
      });

      setSuccess(`Model configuration saved for role: ${selectedRole}`);
      setRoleConfigs(prev => ({
        ...prev,
        [selectedRole]: {
          tier: selectedTier,
          model: modelName,
          token: token || undefined
        }
      }));

      if (onConfigUpdated) {
        onConfigUpdated();
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save model configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  if (loading) {
    return <div className="p-4">Loading model configuration...</div>;
  }

  const modelOptions = availableModels?.modelsByTier[selectedTier];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Model Configuration</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Role --</option>
            <option value="fast">Fast (1B - Autocomplete/Boilerplate)</option>
            <option value="edit">Edit (4B - Light Editing)</option>
            <option value="qa">QA (7B - General Assistant)</option>
            <option value="plan">Plan (15B - Deep Planning)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tier (Size)
          </label>
          <select
            value={selectedTier}
            onChange={(e) => handleTierChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Tier --</option>
            {availableModels?.tiers.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        </div>

        {modelOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={customModel ? '__custom__' : selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Model --</option>
              <option value={modelOptions.default}>{modelOptions.default}</option>
              {modelOptions.alt1 && <option value={modelOptions.alt1}>{modelOptions.alt1}</option>}
              {modelOptions.alt2 && <option value={modelOptions.alt2}>{modelOptions.alt2}</option>}
              <option value="__custom__">Custom Model Name</option>
            </select>
          </div>
        )}

        {(customModel !== '' || selectedModel === '') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Model Name (HuggingFace org/model format)
            </label>
            <input
              type="text"
              value={customModel || selectedModel}
              onChange={(e) => {
                setCustomModel(e.target.value);
                setSelectedModel('');
              }}
              placeholder="e.g., mistralai/Mistral-7B-Instruct-v0.3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HuggingFace Token (Optional - for gated models)
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="hf_xxxxx (only if needed for this model)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Save Configuration
        </button>

        {Object.keys(roleConfigs).length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Configuration</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(roleConfigs).map(([role, config]) => (
                <div key={role} className="flex justify-between py-1 border-b">
                  <span className="font-medium text-gray-700">{role}</span>
                  <span className="text-gray-600">{config.model}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
