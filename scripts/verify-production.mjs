import { isMergedRelease } from './release-policy.mjs';

if (process.env.VERCEL_ENV !== 'production') {
  console.log('Local/preview validation passed; production approval check is not needed.');
} else {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (!/^[a-f0-9]{40}$/.test(sha || '') || process.env.VERCEL_GIT_COMMIT_REF !== 'main') {
    throw new Error('Production requires an identified Git commit from main.');
  }
  // Public repository metadata only: no GitHub token or Vercel secret is needed.
  const response = await fetch(`https://api.github.com/repos/sjoerdvanloon/AppCollectionV1/commits/${sha}/pulls?per_page=100`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Cannot verify a merged release PR (GitHub HTTP ${response.status}). Production blocked.`);
  const pulls = await response.json();
  if (!isMergedRelease(pulls, sha)) throw new Error('Production blocked: this commit is not the result of a merged PR into main.');
  console.log(`Production approved: merged PR verified for ${sha}.`);
}
