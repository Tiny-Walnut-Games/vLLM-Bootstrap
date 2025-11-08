import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';

interface TerminalPanelProps {
  onClose: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    const terminal = new Terminal({
      cols: 120,
      rows: 30,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      },
      fontFamily: '"Courier New", monospace',
      fontSize: 12,
    });

    terminal.open(terminalRef.current);
    terminalInstanceRef.current = terminal;

    terminal.writeln('[Connecting to terminal...]');

    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const socketUrl = `${protocol}://${window.location.host}`;

    const socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      rejectUnauthorized: false,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      terminal.writeln('[Connected to server]');
      socket.emit('terminal_subscribe');
    });

    socket.on('terminal_ready', () => {
      terminal.writeln('[Terminal stream started]');
      terminal.writeln('');
    });

    socket.on('terminal_output', (data: { data: string; timestamp: number }) => {
      terminal.write(data.data);
    });

    socket.on('terminal_command_sent', (data: { command: string }) => {
      terminal.writeln(`[Command sent: ${data.command}]`);
    });

    socket.on('terminal_error', (data: { message: string }) => {
      setError(data.message);
      terminal.writeln(`[ERROR: ${data.message}]`);
    });

    socket.on('terminal_stopped', () => {
      terminal.writeln('[Terminal stream stopped]');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      terminal.writeln('[Disconnected from server]');
    });

    socket.on('connect_error', (error: Error) => {
      setError(error.message);
      terminal.writeln(`[Connection error: ${error.message}]`);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('terminal_unsubscribe');
      socket.disconnect();
      terminal.dispose();
    };
  }, []);

  const handleSendCommand = () => {
    if (inputRef.current && socketRef.current && isConnected) {
      const command = inputRef.current.value.trim();
      if (command) {
        socketRef.current.emit('terminal_command', { command });
        inputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-screen flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Server Terminal
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              {error && ` - Error: ${error}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div
            ref={terminalRef}
            className="w-full h-full bg-gray-900 rounded"
            style={{ minHeight: '400px' }}
          />
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter command (admin only)..."
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendCommand}
              disabled={!isConnected}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ℹ️ Note: Sensitive data (tokens, passwords) in output is automatically redacted.
          </p>
        </div>
      </div>
    </div>
  );
};
