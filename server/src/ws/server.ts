import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';
import { proxyService } from '../proxy/service';
import { terminalService } from '../admin/terminal.service';

interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
  terminalStream?: () => void;
}

export function createWebSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const secret = process.env.JWT_SECRET || 'default-secret';
      const payload = jwt.verify(token, secret) as TokenPayload;
      socket.user = payload;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Client connected: ${socket.user?.username}`);

    socket.on('stream_completion', async (data) => {
      try {
        const stream = await proxyService.streamCompletion({
          model: data.model,
          messages: data.messages,
          stream: true,
          temperature: data.temperature,
          max_tokens: data.max_tokens
        });

        for await (const token of stream) {
          socket.emit('completion_token', { token });
        }

        socket.emit('completion_done');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('completion_error', { 
          message: message.includes('ECONNREFUSED') ? 'Service unavailable' : message
        });
      }
    });

    socket.on('terminal_subscribe', async () => {
      if (socket.user?.role !== 'admin') {
        socket.emit('terminal_error', { message: 'Admin access required' });
        return;
      }

      try {
        const stopStream = await terminalService.streamPane(
          (output) => {
            socket.emit('terminal_output', output);
          },
          (error) => {
            socket.emit('terminal_error', { message: error.message });
          },
          300
        );

        socket.terminalStream = stopStream;
        socket.emit('terminal_ready', { status: 'streaming' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('terminal_error', { message });
      }
    });

    socket.on('terminal_unsubscribe', () => {
      if (socket.terminalStream) {
        socket.terminalStream();
        socket.terminalStream = undefined;
        socket.emit('terminal_stopped', {});
      }
    });

    socket.on('terminal_command', async (data: { command: string }) => {
      if (socket.user?.role !== 'admin') {
        socket.emit('terminal_error', { message: 'Admin access required' });
        return;
      }

      try {
        await terminalService.sendCommand(data.command);
        socket.emit('terminal_command_sent', { command: data.command });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('terminal_error', { message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.user?.username}`);
      if (socket.terminalStream) {
        socket.terminalStream();
      }
    });
  });

  return io;
}
