import { collectStatus } from '../status/collect.mjs';

// Public JSON for /status. GitHub access comes from STATUS_GITHUB_TOKEN (fine-grained, read-only).
// Cached at the edge for 10 minutes so the page does not spend the GitHub rate limit.
export async function GET() {
  const token = process.env.STATUS_GITHUB_TOKEN || undefined;
  try {
    const status = await collectStatus({ token });
    return Response.json(status, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return Response.json({ schema: 1, error: 'Status could not be collected.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
