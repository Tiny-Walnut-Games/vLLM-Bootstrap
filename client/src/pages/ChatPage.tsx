import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Navigation } from '../components/Navigation';

export function ChatPage() {
  const [input, setInput] = useState('');
  const { 
    messages, 
    models, 
    selectedModel, 
    isStreaming, 
    error,
    setSelectedModel, 
    loadModels, 
    sendMessage, 
    clearMessages 
  } = useChatStore();

  useEffect(() => {
    loadModels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Navigation />
      <div className="flex flex-1">
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Models</h2>
            <select
              value={selectedModel || ''}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={clearMessages}
            className="w-full mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
          >
            Clear Chat
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Start a conversation with {selectedModel || 'a model'}
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {msg.role === 'user' ? 'You' : selectedModel}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-gray-100 rounded-lg px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mx-6 mb-2 bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4">
            <div className="flex gap-4 max-w-3xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
