import * as readline from 'readline';
import { userStorage } from '../src/auth/storage';
import { authService } from '../src/auth/service';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function main() {
  console.log('\n=== User Management Tool ===\n');

  const command = process.argv[2];

  try {
    if (command === 'list') {
      await listUsers();
    } else if (command === 'make-admin') {
      const username = process.argv[3];
      if (!username) {
        console.error('Usage: npm run manage-users make-admin <username>');
        process.exit(1);
      }
      await makeAdmin(username);
    } else if (command === 'make-user') {
      const username = process.argv[3];
      if (!username) {
        console.error('Usage: npm run manage-users make-user <username>');
        process.exit(1);
      }
      await makeUser(username);
    } else if (command === 'create') {
      await createUser();
    } else if (command === 'delete') {
      const username = process.argv[3];
      if (!username) {
        console.error('Usage: npm run manage-users delete <username>');
        process.exit(1);
      }
      await deleteUser(username);
    } else {
      showUsage();
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

async function listUsers() {
  const users = await userStorage.listUsers();
  
  if (users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log('\n--- Registered Users ---');
  users.forEach(user => {
    console.log(`  • ${user.username} (Role: ${user.role}) - Created: ${user.createdAt}`);
  });
  console.log();
}

async function makeAdmin(username: string) {
  const user = await userStorage.findByUsername(username);
  
  if (!user) {
    console.error(`User "${username}" not found.`);
    return;
  }

  if (user.role === 'admin') {
    console.log(`"${username}" is already an admin.`);
    return;
  }

  await userStorage.updateUser(user.id, { role: 'admin' });
  console.log(`✓ "${username}" is now an admin.`);
}

async function makeUser(username: string) {
  const user = await userStorage.findByUsername(username);
  
  if (!user) {
    console.error(`User "${username}" not found.`);
    return;
  }

  if (user.role === 'user') {
    console.log(`"${username}" is already a regular user.`);
    return;
  }

  await userStorage.updateUser(user.id, { role: 'user' });
  console.log(`✓ "${username}" is now a regular user.`);
}

async function createUser() {
  const username = await question('Username: ');
  
  const existing = await userStorage.findByUsername(username);
  if (existing) {
    console.error('Username already exists.');
    return;
  }

  const password = await question('Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): ');
  
  const roleInput = await question('Role (admin/user) [user]: ') || 'user';
  const role = roleInput === 'admin' ? 'admin' : 'user';

  try {
    const tokens = await authService.register(username, password, role);
    console.log(`✓ User "${username}" created as ${role}.`);
    console.log('  Access Token:', tokens.accessToken.substring(0, 50) + '...');
  } catch (error) {
    console.error('Failed to create user:', error instanceof Error ? error.message : error);
  }
}

async function deleteUser(username: string) {
  const user = await userStorage.findByUsername(username);
  
  if (!user) {
    console.error(`User "${username}" not found.`);
    return;
  }

  const confirm = await question(`Delete user "${username}"? (yes/no): `);
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('Cancelled.');
    return;
  }

  await userStorage.deleteUser(user.id);
  console.log(`✓ User "${username}" has been deleted.`);
}

function showUsage() {
  console.log(`Usage:
  npm run manage-users list              - List all users
  npm run manage-users create            - Create new user (interactive)
  npm run manage-users make-admin USER   - Make USER an admin
  npm run manage-users make-user USER    - Make USER a regular user
  npm run manage-users delete USER       - Delete USER
`);
}

main().catch(console.error);
