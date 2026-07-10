import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { mdToPdf } from "md-to-pdf";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const SYSTEM_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  // Windows
  process.env.LOCALAPPDATA
    ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
  process.env.PROGRAMFILES
    ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
  process.env["PROGRAMFILES(X86)"]
    ? `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
  process.env.PROGRAMFILES
    ? `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`
    : null,
  process.env["PROGRAMFILES(X86)"]
    ? `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`
    : null,
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function resolveChromeExecutable() {
  for (const candidate of SYSTEM_CHROME_PATHS) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function installPuppeteerChrome() {
  console.log("Installing Puppeteer Chrome (one-time download)...");
  execSync("npx puppeteer browsers install chrome", {
    cwd: rootDir,
    stdio: "inherit",
  });
}

function getLaunchOptions() {
  const executablePath = resolveChromeExecutable();

  if (executablePath) {
    return { executablePath };
  }

  return {};
}

/** Preferred Cursor rule order; any other `.mdc` files are appended alphabetically. */
const RULE_ORDER = [
  "constitution.mdc",
  "feature-branch.mdc",
  "project-structure.mdc",
  "api-conventions.mdc",
  "auth-patterns.mdc",
  "frontend-services.mdc",
  "security.mdc",
  "testing-standards.mdc",
  "ui-style-system.mdc",
];

const PAGE_BREAK = '\n\n<div style="page-break-after: always;"></div>\n\n';

function listFiles(dir, predicate) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter(predicate)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    .map((name) => join(dir, name));
}

function toRepoRelative(absolutePath) {
  return relative(rootDir, absolutePath).split("\\").join("/");
}

function discoverRuleFiles() {
  const rulesDir = join(rootDir, ".cursor", "rules");
  const found = listFiles(rulesDir, (name) => name.endsWith(".mdc")).map(toRepoRelative);
  const ordered = [];

  for (const name of RULE_ORDER) {
    const path = `.cursor/rules/${name}`;
    if (found.includes(path)) {
      ordered.push(path);
    }
  }

  for (const path of found) {
    if (!ordered.includes(path)) {
      ordered.push(path);
    }
  }

  return ordered;
}

function discoverAdrFiles() {
  const adrDir = join(rootDir, "docs", "adr");
  const files = [];
  const readme = join(adrDir, "README.md");

  if (existsSync(readme)) {
    files.push(toRepoRelative(readme));
  }

  for (const absolute of listFiles(adrDir, (name) => /^\d{4}-.+\.md$/i.test(name))) {
    files.push(toRepoRelative(absolute));
  }

  return files;
}

function discoverSpecFiles() {
  const featuresDir = join(rootDir, "features");
  const files = [];

  for (const name of ["README.md", "framework.md"]) {
    const absolute = join(featuresDir, name);
    if (existsSync(absolute)) {
      files.push(toRepoRelative(absolute));
    }
  }

  for (const absolute of listFiles(featuresDir, (name) => /^feature-\d+-.*\.md$/i.test(name))) {
    files.push(toRepoRelative(absolute));
  }

  const referenceDir = join(featuresDir, "reference");
  const referenceReadme = join(referenceDir, "README.md");
  if (existsSync(referenceReadme)) {
    files.push(toRepoRelative(referenceReadme));
  }

  for (const absolute of listFiles(
    referenceDir,
    (name) => name.endsWith(".md") && name !== "README.md",
  )) {
    files.push(toRepoRelative(absolute));
  }

  return files;
}

function stripFrontmatter(text) {
  if (!text.startsWith("---")) {
    return text;
  }
  const end = text.indexOf("\n---", 3);
  if (end === -1) {
    return text;
  }
  return text.slice(end + 4).trimStart();
}

function combineMarkdown(files) {
  return files
    .map((relativePath) => {
      const absolute = join(rootDir, relativePath);
      if (!existsSync(absolute)) {
        console.warn(`Skipping missing file: ${relativePath}`);
        return null;
      }
      const raw = readFileSync(absolute, "utf8");
      const body = relativePath.endsWith(".mdc") ? stripFrontmatter(raw) : raw;
      return `<!-- source: ${relativePath} -->\n\n${body.trim()}`;
    })
    .filter(Boolean)
    .join(PAGE_BREAK);
}

async function exportPdf(markdownPath, pdfPath, title) {
  const launchOptions = getLaunchOptions();

  try {
    await mdToPdf(
      { path: markdownPath },
      {
        dest: pdfPath,
        pdf_options: {
          format: "A4",
          margin: { top: "20mm", right: "16mm", bottom: "20mm", left: "16mm" },
          printBackground: true,
        },
        launch_options: launchOptions,
      },
    );
  } catch (error) {
    if (!resolveChromeExecutable()) {
      installPuppeteerChrome();
      await mdToPdf(
        { path: markdownPath },
        {
          dest: pdfPath,
          pdf_options: {
            format: "A4",
            margin: { top: "20mm", right: "16mm", bottom: "20mm", left: "16mm" },
            printBackground: true,
          },
          launch_options: {},
        },
      );
    } else {
      throw error;
    }
  }

  console.log(`Wrote ${pdfPath} (${title})`);
}

async function main() {
  const outputDir = join(rootDir, "docs");
  const markdownPath = join(outputDir, "speckit-specs.md");
  const pdfPath = join(outputDir, "speckit-specs.pdf");

  const ruleFiles = discoverRuleFiles();
  const adrFiles = discoverAdrFiles();
  const specFiles = discoverSpecFiles();

  console.log(
    `PDF sources — ${ruleFiles.length} rules, ${adrFiles.length} ADRs, ${specFiles.length} feature docs`,
  );

  mkdirSync(outputDir, { recursive: true });

  const combinedMarkdown = [
    `# Speckit — Rules, ADRs & Specs\n\nGenerated by \`npm run specs:pdf\` (auto-discovered).`,
    combineMarkdown(ruleFiles),
    combineMarkdown(adrFiles),
    combineMarkdown(specFiles),
  ].join(PAGE_BREAK);

  writeFileSync(markdownPath, combinedMarkdown, "utf8");
  console.log(`Wrote ${markdownPath}`);

  await exportPdf(markdownPath, pdfPath, "full");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
