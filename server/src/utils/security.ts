export function escapeShellArg(arg: string): string {
  if (typeof arg !== 'string') {
    throw new Error('Argument must be a string');
  }

  if (arg.length === 0) {
    return "''";
  }

  if (!/[^A-Za-z0-9_\-./]/.test(arg)) {
    return arg;
  }

  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

export function sanitizeRoleName(role: string): string {
  if (!role || typeof role !== 'string') {
    throw new Error('Invalid role: must be a non-empty string');
  }

  const sanitized = role.replace(/[^a-z0-9_-]/g, '');
  
  if (sanitized !== role) {
    throw new Error(`Invalid role name: "${role}". Only lowercase letters, numbers, hyphens, and underscores allowed`);
  }

  if (sanitized.length === 0 || sanitized.length > 50) {
    throw new Error('Role name must be between 1 and 50 characters');
  }

  return sanitized;
}

export function sanitizeModelName(model: string): string {
  if (!model || typeof model !== 'string') {
    throw new Error('Invalid model name: must be a non-empty string');
  }

  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(model)) {
    throw new Error(
      `Invalid model name format: "${model}". Expected format: org/model-name (e.g., meta-llama/Llama-3.2-1B)`
    );
  }

  if (model.length > 256) {
    throw new Error('Model name too long (max 256 characters)');
  }

  return model;
}

export function sanitizeToken(token: string): string {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token: must be a non-empty string');
  }

  const sanitized = token.replace(/[^a-zA-Z0-9_-]/g, '');

  if (sanitized !== token) {
    throw new Error('Token contains invalid characters. Only alphanumeric characters, hyphens, and underscores allowed');
  }

  if (sanitized.length < 10 || sanitized.length > 500) {
    throw new Error('Token must be between 10 and 500 characters');
  }

  return sanitized;
}
