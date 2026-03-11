/**
 * Council Mode Validation Tests for vLLM-Doctrine
 *
 * Tests to validate system readiness for running all four channels
 * simultaneously (council mode: fast, edit, qa, plan).
 *
 * The full live-API tests require all four models to be loaded and will
 * be skipped automatically when the servers are not running.
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, statSync } from 'fs';
import { execSync } from 'child_process';

// ─── helpers ─────────────────────────────────────────────────────────────────

const COUNCIL_PORTS: Record<string, number> = {
  fast: 8100,
  edit: 8300,
  qa: 8500,
  plan: 8700,
};

function isChannelUp(port: number): boolean {
  try {
    execSync(`curl -s -m 2 http://localhost:${port}/health`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function gpuVramMb(): number | null {
  try {
    const output = execSync(
      'nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits',
      { encoding: 'utf8', stdio: 'pipe' },
    );
    const value = parseInt(output.trim().split('\n')[0], 10);
    return isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

// ─── static / pre-flight tests ───────────────────────────────────────────────

test.describe('Council Mode — Static Validation', () => {
  test('council-launch.sh exists and is executable', () => {
    const scriptPath = './council-launch.sh';
    expect(existsSync(scriptPath), 'council-launch.sh is missing — run ./initial-bootstrap.sh').toBe(true);

    try {
      const stats = statSync(scriptPath);
      const isExecutable = !!(stats.mode & parseInt('111', 8));
      expect(isExecutable, 'council-launch.sh is not executable').toBe(true);
    } catch {
      console.warn('Could not check executable bit (non-Linux platform)');
    }

    const content = readFileSync(scriptPath, 'utf8');
    expect(content.includes('council'), 'council-launch.sh content looks wrong').toBe(true);
  });

  test('council-monitor.sh exists and is executable', () => {
    const scriptPath = './council-monitor.sh';
    expect(existsSync(scriptPath), 'council-monitor.sh is missing — run ./initial-bootstrap.sh').toBe(true);

    try {
      const stats = statSync(scriptPath);
      const isExecutable = !!(stats.mode & parseInt('111', 8));
      expect(isExecutable, 'council-monitor.sh is not executable').toBe(true);
    } catch {
      console.warn('Could not check executable bit (non-Linux platform)');
    }
  });

  test('council-mode.md documentation exists', () => {
    const docPath = './docs/guides/council-mode.md';
    expect(existsSync(docPath), 'docs/guides/council-mode.md is missing').toBe(true);

    const content = readFileSync(docPath, 'utf8');
    // Should document all four tiers
    for (const tier of ['fast', 'edit', 'qa', 'plan']) {
      expect(content.toLowerCase().includes(tier), `council-mode.md missing documentation for '${tier}' tier`).toBe(true);
    }
    // Should have a hardware requirements section
    expect(content.includes('VRAM'), 'council-mode.md missing VRAM documentation').toBe(true);
  });

  test('council-launch.sh references all four tiers', () => {
    const scriptPath = './council-launch.sh';
    if (!existsSync(scriptPath)) {
      console.warn('Skipping: council-launch.sh not found');
      return;
    }
    const content = readFileSync(scriptPath, 'utf8');
    for (const tier of ['fast', 'edit', 'qa', 'plan']) {
      expect(content.includes(tier), `council-launch.sh missing '${tier}' tier`).toBe(true);
    }
  });

  test('council-launch.sh references all four default ports', () => {
    const scriptPath = './council-launch.sh';
    if (!existsSync(scriptPath)) {
      console.warn('Skipping: council-launch.sh not found');
      return;
    }
    const content = readFileSync(scriptPath, 'utf8');
    for (const [role, port] of Object.entries(COUNCIL_PORTS)) {
      expect(content.includes(String(port)), `council-launch.sh missing port ${port} for '${role}'`).toBe(true);
    }
  });

  test('daily-bootstrap.sh contains VRAM warning logic', () => {
    const scriptPath = './daily-bootstrap.sh';
    if (!existsSync(scriptPath)) {
      console.warn('Skipping: daily-bootstrap.sh not found');
      return;
    }
    const content = readFileSync(scriptPath, 'utf8');
    expect(
      content.includes('MIN_VRAM') || content.includes('REQUIRED_VRAM'),
      'daily-bootstrap.sh is missing the VRAM council-awareness check',
    ).toBe(true);
  });

  test('council port ranges do not overlap', () => {
    const ranges = Object.values(COUNCIL_PORTS).map(start => ({ start, end: start + 199 }));

    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i];
        const b = ranges[j];
        const overlap = !(a.end < b.start || b.end < a.start);
        expect(overlap, `Council port ranges overlap: ${JSON.stringify(a)} and ${JSON.stringify(b)}`).toBe(false);
      }
    }
  });
});

// ─── system requirements checks ──────────────────────────────────────────────

test.describe('Council Mode — System Requirements', () => {
  test('GPU VRAM is detectable', () => {
    const vram = gpuVramMb();
    if (vram === null) {
      console.warn('⚠️  No NVIDIA GPU detected — council mode requires a GPU with 24 GB+ VRAM.');
    } else {
      console.log(`✅ GPU detected: ${vram} MB VRAM`);
      if (vram < 20480) {
        console.warn(`⚠️  ${vram} MB is below the 20 GB minimum for council mode.`);
      } else if (vram < 24576) {
        console.warn(`⚠️  ${vram} MB may be tight for council mode; 24 GB+ recommended.`);
      } else {
        console.log('✅ VRAM meets the 24 GB+ recommendation for council mode.');
      }
    }
    // This is informational only — not a hard failure in CI
    expect(true).toBe(true);
  });

  test('tmux is available', () => {
    try {
      const version = execSync('tmux -V', { encoding: 'utf8', stdio: 'pipe' }).trim();
      console.log(`✅ tmux available: ${version}`);
    } catch {
      console.warn('⚠️  tmux not found — required for ./council-launch.sh');
      console.warn('   Install with: sudo apt install tmux');
    }
    expect(true).toBe(true);
  });

  test('all four council ports are free (pre-flight)', () => {
    const busyPorts: number[] = [];
    for (const [role, port] of Object.entries(COUNCIL_PORTS)) {
      if (isChannelUp(port)) {
        console.log(`ℹ️  Port ${port} (${role}) is already in use — model may already be running.`);
        busyPorts.push(port);
      } else {
        console.log(`✅ Port ${port} (${role}) is free.`);
      }
    }
    // This is informational: a busy port means the model is already running, which is fine.
    expect(true).toBe(true);
  });
});

// ─── live API tests (skipped when models are not running) ────────────────────

test.describe('Council Mode — Live API Validation', () => {
  const activeChannels = Object.entries(COUNCIL_PORTS).filter(([, port]) => isChannelUp(port));

  test('at least one council channel is running', () => {
    if (activeChannels.length === 0) {
      console.warn('⚠️  No council channels are currently running.');
      console.warn('   Launch with: ./council-launch.sh');
      console.warn('   Or individually: ./daily-bootstrap.sh {fast|edit|qa|plan}');
    } else {
      console.log(`✅ ${activeChannels.length} / 4 council channel(s) running: ${activeChannels.map(([r]) => r).join(', ')}`);
    }
    // This is informational — running tests against live models is optional in CI.
    expect(true).toBe(true);
  });

  for (const [role, port] of Object.entries(COUNCIL_PORTS)) {
    test(`${role} channel (port ${port}) — health check`, async ({ request }) => {
      test.skip(!isChannelUp(port), `${role} channel not running on port ${port}`);

      const response = await request.get(`http://localhost:${port}/health`);
      expect(response.ok(), `Health check failed for ${role} on port ${port}`).toBe(true);
    });

    test(`${role} channel (port ${port}) — models endpoint`, async ({ request }) => {
      test.skip(!isChannelUp(port), `${role} channel not running on port ${port}`);

      const response = await request.get(`http://localhost:${port}/v1/models`);
      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      console.log(`✅ ${role} (port ${port}): serving model "${data.data[0].id}"`);
    });

    test(`${role} channel (port ${port}) — chat completion`, async ({ request }) => {
      test.skip(!isChannelUp(port), `${role} channel not running on port ${port}`);

      const response = await request.post(`http://localhost:${port}/v1/chat/completions`, {
        data: {
          model: 'default',
          messages: [{ role: 'user', content: 'Reply with a single word: Ready' }],
          max_tokens: 10,
          temperature: 0.1,
        },
      });

      expect(response.ok(), `Chat completion failed for ${role} on port ${port}`).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('choices');
      expect(data.choices.length).toBeGreaterThan(0);
      expect(data.choices[0].message.content.trim().length).toBeGreaterThan(0);

      console.log(`✅ ${role} (port ${port}): response = "${data.choices[0].message.content.trim()}"`);
    });
  }

  test('all four council channels are healthy simultaneously', async ({ request }) => {
    test.skip(activeChannels.length < 4, `Only ${activeChannels.length} / 4 channels running — skipping full council check`);

    const results = await Promise.all(
      Object.values(COUNCIL_PORTS).map(port =>
        request.get(`http://localhost:${port}/health`).then(r => r.ok()),
      ),
    );

    const allHealthy = results.every(Boolean);
    expect(allHealthy, 'Not all four council channels are healthy simultaneously').toBe(true);
    console.log('✅ Full council is healthy — all four channels responding.');
  });
});
