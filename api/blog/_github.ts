/**
 * Minimal GitHub Contents API client for committing generated blog files.
 *
 * We avoid pulling in Octokit to keep the serverless bundle small — the
 * Contents API is enough for our use-case (read a file, write a file, create
 * multiple files in a single commit via a tree).
 *
 * Env required:
 *   GITHUB_TOKEN  — fine-grained PAT with "Contents: Read and write" on the
 *                   freeroomplanner.com repo.
 *   GITHUB_REPO   — "benshevlane/freeroomplanner.com" (default)
 *   GITHUB_BRANCH — "main" (default)
 */

const API = "https://api.github.com";

function repoInfo() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "benshevlane/freeroomplanner.com";
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token) throw new Error("GITHUB_TOKEN is not configured");
  return { token, repo, branch };
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "freeroomplanner-publish-api",
  };
}

export async function ghFileExists(path: string): Promise<boolean> {
  const { token, repo, branch } = repoInfo();
  const url = `${API}/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: authHeaders(token) });
  return r.status === 200;
}

export async function ghGetFile(path: string): Promise<{ content: string; sha: string }> {
  const { token, repo, branch } = repoInfo();
  const url = `${API}/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: authHeaders(token) });
  if (!r.ok) {
    throw new Error(`Failed to read ${path}: ${r.status} ${await r.text()}`);
  }
  const json: any = await r.json();
  return {
    content: Buffer.from(json.content, "base64").toString("utf8"),
    sha: json.sha,
  };
}

/**
 * Commit multiple files to `branch` in a single commit using the git-data API.
 * This is atomic — either all files land or none do.
 */
export async function ghCommitMany(
  files: Array<{ path: string; content: string }>,
  message: string,
): Promise<{ commitSha: string; commitUrl: string }> {
  const { token, repo, branch } = repoInfo();
  const headers = authHeaders(token);

  // 1. Get the branch's current commit + tree SHA
  const refRes = await fetch(`${API}/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, { headers });
  if (!refRes.ok) throw new Error(`Failed to read branch ref: ${refRes.status} ${await refRes.text()}`);
  const ref: any = await refRes.json();
  const parentCommitSha = ref.object.sha;

  const parentRes = await fetch(`${API}/repos/${repo}/git/commits/${parentCommitSha}`, { headers });
  if (!parentRes.ok) throw new Error(`Failed to read parent commit: ${parentRes.status} ${await parentRes.text()}`);
  const parent: any = await parentRes.json();
  const baseTreeSha = parent.tree.sha;

  // 2. Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (f) => {
      const r = await fetch(`${API}/repos/${repo}/git/blobs`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          content: Buffer.from(f.content, "utf8").toString("base64"),
          encoding: "base64",
        }),
      });
      if (!r.ok) throw new Error(`Blob create failed for ${f.path}: ${r.status} ${await r.text()}`);
      const j: any = await r.json();
      return { path: f.path, sha: j.sha };
    }),
  );

  // 3. Build a new tree off the base tree
  const treeRes = await fetch(`${API}/repos/${repo}/git/trees`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      })),
    }),
  });
  if (!treeRes.ok) throw new Error(`Tree create failed: ${treeRes.status} ${await treeRes.text()}`);
  const tree: any = await treeRes.json();

  // 4. Create the commit
  const commitRes = await fetch(`${API}/repos/${repo}/git/commits`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [parentCommitSha],
    }),
  });
  if (!commitRes.ok) throw new Error(`Commit create failed: ${commitRes.status} ${await commitRes.text()}`);
  const commit: any = await commitRes.json();

  // 5. Fast-forward the branch ref
  const updateRes = await fetch(`${API}/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  if (!updateRes.ok) throw new Error(`Branch update failed: ${updateRes.status} ${await updateRes.text()}`);

  return { commitSha: commit.sha, commitUrl: commit.html_url };
}
