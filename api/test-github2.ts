import 'dotenv/config';
import { GitHubClient } from './src/internal/github/client';
import { fetchSnapshot } from './src/internal/github/fetch';

async function main() {
  const client = new GitHubClient();
  console.log('Token:', client['token']?.slice(0, 20), '...len:', client['token']?.length);

  try {
    const profile = await client.getProfile('torvalds');
    console.log('Profile OK:', profile.login, profile.name, 'repos:', profile.public_repos);
  } catch (e) {
    console.log('Profile error:', e instanceof Error ? { name: e.name, message: e.message } : e);
  }

  try {
    const repos = await client.getRepos('torvalds');
    console.log('Repos OK:', repos.length);
  } catch (e) {
    console.log('Repos error:', e instanceof Error ? { name: e.name, message: e.message } : e);
  }

  try {
    const events = await client.getPublicEvents('torvalds');
    console.log('Events OK:', events.length);
  } catch (e) {
    console.log('Events error:', e instanceof Error ? { name: e.name, message: e.message } : e);
  }

  try {
    const contributions = await client.getContributions('torvalds');
    console.log('Contributions OK:', contributions.total_commit_contributions);
  } catch (e) {
    console.log('Contributions error:', e instanceof Error ? { name: e.name, message: e.message } : e);
  }

  try {
    const snap = await fetchSnapshot(client, 'torvalds');
    console.log('Snapshot OK:', snap.profile.login, 'repos:', snap.repos.length, 'events:', snap.events.length);
  } catch (e) {
    console.log('Snapshot error:', e instanceof Error ? { name: e.name, message: e.message } : e);
  }
}

main().catch(console.error);
