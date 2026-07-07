/**
 * Push Todo Speckit backlog to Digital.ai Agility via Bulk JSON API.
 *
 * Auth: Access Token (Bearer) — create in Agility: My Settings → Access Tokens
 * Docs: https://docs.digital.ai/agility/docs/developerlibrary/access-token-authentication
 *       https://docs.digital.ai/agility/docs/asset-creation-examples-1
 *
 * Usage:
 *   node scripts/push-agility-api.mjs
 *   node scripts/push-agility-api.mjs --dry-run
 *   node scripts/push-agility-api.mjs --verify
 *   node scripts/push-agility-api.mjs --project "My Project"
 *
 * Optional: copy .env.agility.example → .env.agility (gitignored)
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBacklog, DEFAULT_PROJECT } from "./agility/backlog-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }
  const lines = readFileSync(path, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(rootDir, ".env.agility"));

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const verifyOnly = args.includes("--verify");
const projectArg = args.includes("--project")
  ? args[args.indexOf("--project") + 1]
  : null;

const baseUrl = (process.env.AGILITY_BASE_URL ?? "").replace(/\/$/, "");
const accessToken = process.env.AGILITY_ACCESS_TOKEN ?? "";
const scopeName = projectArg ?? process.env.AGILITY_SCOPE ?? DEFAULT_PROJECT;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!dryRun && !verifyOnly) {
  if (!baseUrl) {
    fail("Set AGILITY_BASE_URL (e.g. https://your-instance.com)");
  }
  if (!accessToken) {
    fail("Set AGILITY_ACCESS_TOKEN (Bearer token from Agility My Settings → Access Tokens)");
  }
}

function authHeaders(contentType = "application/json") {
  const headers = { Authorization: `Bearer ${accessToken}` };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

function parseBulkResponse(data, label) {
  if (!data || typeof data !== "object") {
    throw new Error(`${label}: unexpected non-JSON response`);
  }

  const failures = data.commandFailures?.commands ?? [];
  if (failures.length > 0) {
    throw new Error(
      `${label} reported ${failures.length} command failure(s):\n${JSON.stringify(failures, null, 2)}`,
    );
  }

  const created = data.assetsCreated?.oidTokens ?? [];
  const modified = data.assetsModified?.oidTokens ?? [];
  return { created, modified, raw: data };
}

async function apiPost(path, body, label = "Bulk API") {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    throw new Error(`${label} failed (${response.status}): ${detail}`);
  }

  return parseBulkResponse(data, label);
}

async function restGet(path) {
  const response = await fetch(`${baseUrl}${path}`, { headers: authHeaders(null) });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

async function resolveScopeRef() {
  if (scopeName.startsWith("Scope:")) {
    return scopeName;
  }

  const where = `Name='${scopeName.replace(/'/g, "''")}'`;
  const { ok, status, text } = await restGet(
    `/rest-1.v1/Data/Scope?sel=Name&where=${encodeURIComponent(where)}`,
  );

  if (!ok) {
    throw new Error(`Scope lookup failed (${status}): ${text.slice(0, 400)}`);
  }

  const oid =
    text.match(/\bid="(Scope:\d+)"/)?.[1] ??
    text.match(/\bid='(Scope:\d+)'/)?.[1];
  if (!oid) {
    fail(
      `No Agility project named "${scopeName}". Use the exact Product Planning project name or set AGILITY_SCOPE=Scope:12345.`,
    );
  }

  return oid;
}

function buildEpicPayloads(backlog, scopeRef) {
  return backlog.features.map((feature) => ({
    Scope: scopeRef,
    AssetType: "Epic",
    Name: feature.epic.name,
    Description: feature.epic.description,
  }));
}

function buildStoryPayloads(feature, scopeRef, epicOid) {
  return feature.stories.map((story) => ({
    Scope: scopeRef,
    AssetType: "Story",
    Name: story.name,
    Description: story.description,
    Super: epicOid,
    Children: story.tests.map((test) => ({
      AssetType: "Test",
      Name: test.name,
      Description: test.description,
      ExpectedResults: test.expectedResults,
    })),
  }));
}

async function countAssetsInScope(assetType, scopeRef) {
  const scopeFilter = scopeRef.startsWith("Scope:")
    ? `Scope='${scopeRef}'`
    : `Scope.Name='${scopeName.replace(/'/g, "''")}'`;
  const { ok, text } = await restGet(
    `/rest-1.v1/Data/${assetType}?sel=Name&where=${encodeURIComponent(scopeFilter)}&page=1,0`,
  );
  if (!ok) {
    return -1;
  }
  return (text.match(/<Asset /g) || []).length;
}

async function verifyPush(scopeRef) {
  console.log(`Verify — ${scopeName} (${scopeRef})`);
  console.log("");

  const epics = await countAssetsInScope("Epic", scopeRef);
  const stories = await countAssetsInScope("Story", scopeRef);

  console.log(`  Epics in project:   ${epics >= 0 ? epics : "query failed"}`);
  console.log(`  Stories in project: ${stories >= 0 ? stories : "query failed"}`);

  console.log("");
  console.log("Where to look in Agility UI:");
  console.log("  • Epics → Product Planning → Portfolio / Epics (not Team Backlog)");
  console.log("  • Stories → Product Planning → Backlog for this project");
  console.log("  • Tests → open a Story → Tests / Acceptance Criteria tab");
}

async function main() {
  if (verifyOnly) {
    if (!baseUrl || !accessToken) {
      fail("Set AGILITY_BASE_URL and AGILITY_ACCESS_TOKEN for --verify");
    }
    const scopeRef = await resolveScopeRef();
    await verifyPush(scopeRef);
    return;
  }

  const backlog = buildBacklog(scopeName);

  console.log(`Agility push — ${scopeName}`);
  console.log(`  ${backlog.totals.epics} epics, ${backlog.totals.stories} stories, ${backlog.totals.tests} tests`);
  console.log("");

  const scopeRef = dryRun ? scopeName : await resolveScopeRef();

  const epicPayloads = buildEpicPayloads(backlog, scopeRef);

  if (dryRun) {
    console.log("DRY RUN — payloads that would be POSTed to /api/asset\n");
    console.log("Phase 1 — create epics:");
    console.log(JSON.stringify(epicPayloads, null, 2));
    console.log("\nPhase 2 — create stories + tests (direct create, linked via Super):");
    for (const feature of backlog.features) {
      console.log(JSON.stringify(buildStoryPayloads(feature, scopeRef, `Epic:<oid>`), null, 2));
    }
    console.log("\nSet AGILITY_BASE_URL and AGILITY_ACCESS_TOKEN, then re-run without --dry-run.");
    return;
  }

  console.log(`Scope resolved: ${scopeRef}`);
  console.log("Phase 1: Creating epics…");
  const epicResult = await apiPost("/api/asset", epicPayloads, "Epic create");
  if (epicResult.created.length !== backlog.features.length) {
    throw new Error(
      `Expected ${backlog.features.length} epic OIDs, got ${epicResult.created.length}: ${epicResult.created.join(", ")}`,
    );
  }

  for (let i = 0; i < backlog.features.length; i += 1) {
    const feature = backlog.features[i];
    const epicOid = epicResult.created[i];
    const storyPayloads = buildStoryPayloads(feature, scopeRef, epicOid);

    console.log(
      `Phase 2: ${feature.epic.name} (${epicOid}) — ${storyPayloads.length} stories, ${feature.stories.reduce((n, s) => n + s.tests.length, 0)} tests…`,
    );

    const storyResult = await apiPost("/api/asset", storyPayloads, `Stories for ${feature.epic.name}`);
    console.log(`  Created: ${storyResult.created.length} assets`);
  }

  console.log("");
  await verifyPush(scopeRef);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
