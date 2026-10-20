type CleanupOperations = {
  candidates(): Promise<{ path: string }[]>;
  referenced(paths: string[]): Promise<string[]>;
  remove(paths: string[]): Promise<void>;
};

export async function cleanupPreviewPdfs(operations: CleanupOperations): Promise<{ deleted: number }> {
  const candidates = await operations.candidates();
  // Fail closed on unexpected paths even if the database query is changed later.
  if (!Array.isArray(candidates) || candidates.length > 500 || candidates.some(row =>
    !row || typeof row.path !== "string" || !/^[0-9a-f-]{36}\/(preview\/)?[0-9a-f-]{36}\.pdf$/.test(row.path))) {
    throw Error("Unexpected preview cleanup candidates; no files removed.");
  }
  const paths = [...new Set(candidates.map(row => row.path))];
  let deleted = 0;
  for (let start = 0; start < paths.length; start += 100) {
    const batch = paths.slice(start, start + 100);
    const protectedPaths = new Set(await operations.referenced(batch));
    const removable = batch.filter(path => !protectedPaths.has(path));
    if (!removable.length) continue;
    await operations.remove(removable);
    deleted += removable.length;
  }
  return { deleted };
}
