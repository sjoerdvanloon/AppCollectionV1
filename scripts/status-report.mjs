// Weekly report: node scripts/status-report.mjs [--from https://www.sjoerdvanloon.nl/api/status] [--json]
// Without --from it collects directly, using GITHUB_TOKEN or STATUS_GITHUB_TOKEN if set.
import { collectStatus } from '../status/collect.mjs';
import { toMarkdown } from '../status/report.mjs';

const args = process.argv.slice(2);
const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : null;
const status = from
  ? await (await fetch(from, { signal: AbortSignal.timeout(60000) })).json()
  : await collectStatus({ token: process.env.STATUS_GITHUB_TOKEN || process.env.GITHUB_TOKEN || undefined });
process.stdout.write(args.includes('--json') ? JSON.stringify(status, null, 2) + '\n' : toMarkdown(status));
