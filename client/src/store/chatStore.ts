import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { Message, Model } from '../types';

interface ChatState {
  messages: Message[];
  models: Model[];
  selectedModel: string | null;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  
  setSelectedModel: (modelId: string) => void;
  loadModels: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  models: [],
  selectedModel: null,
  isStreaming: false,
  isLoading: false,
  error: null,

  setSelectedModel: (modelId: string) => {
    set({ selectedModel: modelId });
  },

  loadModels: async () => {
    set({ isLoading: true, error: null });
    try {
      const models = await apiClient.listModels();
      set({ 
        models, 
        selectedModel: models[0]?.id || null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to load models',
        isLoading: false 
      });
    }
  },

  sendMessage: async (content: string) => {
    const { selectedModel, messages } = get();
    
    if (!selectedModel) {
      set({ error: 'No model selected' });
      return;
    }

    const userMessage: Message = { role: 'user', content };
    set({ 
      messages: [...messages, userMessage],
      isStreaming: true,
      error: null
    });

    try {
      const response = await apiClient.createCompletion({
        model: selectedModel,
        messages: [...messages, userMessage],
        stream: false
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.choices[0].message.content
      };

      set(state => ({
        messages: [...state.messages, assistantMessage],
        isStreaming: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to send message',
        isStreaming: false
      });
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  }
}));
