// Creates backend/.env from backend/.env.example on first setup (never overwrites).
import { copyFileSync, existsSync } from 'node:fs';

const target = 'backend/.env';
if (existsSync(target)) {
  console.log(`${target} already exists, leaving it unchanged.`);
} else {
  copyFileSync('backend/.env.example', target);
  console.log(`Created ${target} from backend/.env.example`);
}
