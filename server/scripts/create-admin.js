// Create (or promote) an admin account. There are NO default admin credentials anywhere
// in this codebase: you supply them here.
//
//   npm run create-admin                       prompts for email and password
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin
//
// With MONGO_URI set, the account is stored in MongoDB. Without it the server keeps users
// in memory, so an admin created here would vanish: the script refuses to run in that case.
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('node:readline');
const store = require('../lib/store');
const { passwordProblem, isEmail } = require('../lib/auth');

function ask(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return new Promise((resolve) => {
    if (hidden) {
      // Stop the password appearing on screen
      const onData = (char) => {
        if (['\n', '\r', '\u0004'].includes(char.toString())) process.stdin.removeListener('data', onData);
        else rl.output.write('\x1B[2K\x1B[200D' + question + '*'.repeat(rl.line.length));
      };
      process.stdin.on('data', onData);
    }
    rl.question(question, (answer) => {
      if (hidden) rl.output.write('\n');
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Without a database users are kept in memory only,');
    console.error('so an admin created now would disappear when the server restarts.');
    console.error('Set MONGO_URI in server/.env first.');
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL || (await ask('Admin email: '));
  if (!isEmail(email)) {
    console.error('That is not a valid email address.');
    process.exit(1);
  }

  const password = process.env.ADMIN_PASSWORD || (await ask('Admin password (hidden): ', { hidden: true }));
  const problem = passwordProblem(password);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }

  const name = process.env.ADMIN_NAME || 'Administrator';

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const created = await store.createUser({ name, email, password, role: 'admin' });
    if (created) {
      console.log(`Created admin account for ${created.email}.`);
    } else {
      // The address already exists: promote it rather than creating a duplicate
      const promoted = await store.setUserRole(email, 'admin');
      console.log(
        promoted
          ? `That account already existed; it is now an admin (${promoted.email}). Its password was NOT changed.`
          : 'Could not create or promote that account.'
      );
      if (!promoted) process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('create-admin failed:', err.message);
  process.exit(1);
});
