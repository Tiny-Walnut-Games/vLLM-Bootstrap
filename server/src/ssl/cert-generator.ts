import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const CERT_DIR = join(process.cwd(), '.ssl');
const CERT_FILE = join(CERT_DIR, 'server.crt');
const KEY_FILE = join(CERT_DIR, 'server.key');

export function ensureSelfSignedCerts(): { cert: string; key: string } {
  if (!existsSync(CERT_DIR)) {
    mkdirSync(CERT_DIR, { recursive: true });
  }

  if (existsSync(CERT_FILE) && existsSync(KEY_FILE)) {
    console.log('[SSL] Using existing self-signed certificates');
    const cert = require('fs').readFileSync(CERT_FILE, 'utf8');
    const key = require('fs').readFileSync(KEY_FILE, 'utf8');
    return { cert, key };
  }

  console.log('[SSL] Generating self-signed certificate...');
  
  try {
    execSync(
      `openssl req -x509 -newkey rsa:2048 -nodes -out "${CERT_FILE}" -keyout "${KEY_FILE}" -days 365 -subj "/CN=localhost"`,
      { stdio: 'pipe' }
    );
    console.log('[SSL] ✅ Self-signed certificate generated');
  } catch (error) {
    console.error('[SSL] Failed to generate certificate:', error);
    throw new Error('Failed to generate SSL certificate. Ensure openssl is installed.');
  }

  const cert = require('fs').readFileSync(CERT_FILE, 'utf8');
  const key = require('fs').readFileSync(KEY_FILE, 'utf8');
  return { cert, key };
}
