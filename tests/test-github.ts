import 'dotenv/config';
import { GitHubClient } from './src/internal/github/client';
import { fetchSnapshot } from './src/internal/github/fetch';

async function main() {
  const client = new GitHubClient();
  console.log('Token length:', client['token']?.length || 0);
  console.log('Token first 10:', client['token']?.slice(0, 10));

  try {
    const profile = await client.getProfile('torvalds');
    console.log('Profile:', profile.login, profile.name);
  } catch (e) {
    console.log('Profile error:', e);
  }

  try {
    const snap = await fetchSnapshot(client, 'torvalds');
    console.log('Snapshot fetched, repos:', snap.repos.length);
  } catch (e) {
    console.log('Snapshot error:', e);
  }
}

main().catch(console.error);
