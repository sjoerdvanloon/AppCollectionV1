export function isMergedRelease(pulls, sha) {
  return Array.isArray(pulls) && pulls.some(pr =>
    pr.merged_at && pr.state === 'closed' && pr.base?.ref === 'main' &&
    pr.base?.repo?.full_name === 'sjoerdvanloon/AppCollectionV1' && pr.merge_commit_sha === sha
  );
}
