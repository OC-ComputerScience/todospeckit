import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mdToPdf } from "md-to-pdf";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const SYSTEM_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
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

const RULE_FILES = [
  ".cursor/rules/constitution.mdc",
  ".cursor/rules/project-structure.mdc",
  ".cursor/rules/api-conventions.mdc",
  ".cursor/rules/auth-patterns.mdc",
  ".cursor/rules/frontend-services.mdc",
  ".cursor/rules/security.mdc",
  ".cursor/rules/testing-standards.mdc",
  ".cursor/rules/ui-style-system.mdc",
];

const ADR_FILES = [
  "docs/adr/README.md",
  "docs/adr/0001-client-server-multi-user-architecture.md",
  "docs/adr/0002-security-architecture.md",
  "docs/adr/0003-mysql-relational-database.md",
];

const FEATURE_CATALOG_FILES = [
  "features/README.md",
  "features/framework.md",
];

const FEATURE_SPEC_FILES = [
  "features/feature-1-user-auth.md",
  "features/feature-2-todo-list-management.md",
  "features/feature-3-todo-list-item-management.md",
  "features/feature-4-user-profile-management.md",
  "features/feature-5-todo-due-date.md",
];

const REFERENCE_FILES = [
  "features/reference/README.md",
  "features/reference/data-model.md",
  "features/reference/api.md",
];

const PAGE_BREAK = '\n\n<div style="page-break-after: always;"></div>\n\n';

const EXPORT_PROFILES = {
  full: {
    title: "Todo Speckit — Rules & Specifications",
    subtitle: "Generated from `.cursor/rules/`, `docs/adr/`, and `features/`.",
    markdownName: "todo-speckit-specs.md",
    pdfName: "todo-speckit-specs.pdf",
    build: buildFullMarkdown,
  },
  features: {
    title: "Todo Speckit — Feature Specifications",
    subtitle: "Product requirements only — `features/` catalog, framework, and feature specs.",
    markdownName: "todo-speckit-features.md",
    pdfName: "todo-speckit-features.pdf",
    build: buildFeaturesMarkdown,
  },
};

function stripFrontmatter(content) {
  if (!content.startsWith("---")) {
    return content;
  }

  const end = content.indexOf("---", 3);
  if (end === -1) {
    return content;
  }

  return content.slice(end + 3).trimStart();
}

function readSection(relativePath) {
  const absolutePath = join(rootDir, relativePath);
  const raw = readFileSync(absolutePath, "utf8");
  const body = relativePath.endsWith(".mdc") ? stripFrontmatter(raw) : raw;
  const title = relativePath.split("/").pop();

  return `<!-- source: ${relativePath} -->\n\n# ${title}\n\n${body.trim()}`;
}

function readSections(relativePaths) {
  return relativePaths.map(readSection);
}

function buildFullMarkdown() {
  const ruleSections = readSections(RULE_FILES);
  const adrSections = readSections(ADR_FILES);
  const catalogSections = readSections(FEATURE_CATALOG_FILES);
  const featureSections = readSections(FEATURE_SPEC_FILES);
  const referenceSections = readSections(REFERENCE_FILES);

  return [
    `# ${EXPORT_PROFILES.full.title}`,
    "",
    EXPORT_PROFILES.full.subtitle,
    "",
    "---",
    "",
    "# Part 1: Cursor Rules",
    "",
    ruleSections.join(PAGE_BREAK),
    PAGE_BREAK,
    "# Part 2: Architecture Decision Records",
    "",
    adrSections.join(PAGE_BREAK),
    PAGE_BREAK,
    "# Part 3: Feature Specifications",
    "",
    [...catalogSections, ...featureSections].join(PAGE_BREAK),
    PAGE_BREAK,
    "# Part 4: Reference (current integrated state)",
    "",
    referenceSections.join(PAGE_BREAK),
  ].join("\n");
}

function buildFeaturesMarkdown() {
  const catalogSections = readSections(FEATURE_CATALOG_FILES);
  const featureSections = readSections(FEATURE_SPEC_FILES);

  return [
    `# ${EXPORT_PROFILES.features.title}`,
    "",
    EXPORT_PROFILES.features.subtitle,
    "",
    "---",
    "",
    "# Part 1: Catalog & methodology",
    "",
    catalogSections.join(PAGE_BREAK),
    PAGE_BREAK,
    "# Part 2: Feature requirements",
    "",
    featureSections.join(PAGE_BREAK),
  ].join("\n");
}

async function renderPdf(combinedMarkdown, pdfPath) {
  const config = {
    dest: pdfPath,
    pdf_options: {
      format: "Letter",
      margin: "20mm",
      printBackground: true,
    },
    launch_options: getLaunchOptions(),
  };

  try {
    return await mdToPdf({ content: combinedMarkdown }, config);
  } catch (error) {
    const message = String(error?.message ?? error);
    const chromeMissing = message.includes("Could not find Chrome");

    if (!chromeMissing || resolveChromeExecutable()) {
      throw error;
    }

    installPuppeteerChrome();

    return mdToPdf(
      { content: combinedMarkdown },
      { ...config, launch_options: getLaunchOptions() }
    );
  }
}

function resolveModes(argv) {
  const args = argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    return { help: true };
  }

  if (args.includes("all")) {
    return { modes: ["full", "features"] };
  }

  if (args.includes("features")) {
    return { modes: ["features"] };
  }

  if (args.includes("full")) {
    return { modes: ["full"] };
  }

  return { modes: ["full"] };
}

async function exportProfile(mode) {
  const profile = EXPORT_PROFILES[mode];

  if (!profile) {
    throw new Error(`Unknown export mode: ${mode}`);
  }

  const combinedMarkdown = profile.build();
  const outputDir = join(rootDir, "docs");
  const markdownPath = join(outputDir, profile.markdownName);
  const pdfPath = join(outputDir, profile.pdfName);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(markdownPath, combinedMarkdown, "utf8");

  const pdf = await renderPdf(combinedMarkdown, pdfPath);

  if (!pdf) {
    throw new Error(`PDF generation failed for ${mode}.`);
  }

  console.log(`Wrote ${markdownPath}`);
  console.log(`Wrote ${pdfPath}`);
}

function printHelp() {
  console.log(`Usage: node scripts/export-specs-pdf.mjs [mode]

Modes:
  full       Rules + ADRs + feature specs + reference (default)
  features   Feature catalog, framework, and feature specs only
  all        Generate both PDFs

Examples:
  npm run specs:pdf
  npm run specs:pdf:features
  npm run specs:pdf:all
`);
}

async function main() {
  const resolved = resolveModes(process.argv);

  if (resolved.help) {
    printHelp();
    return;
  }

  for (const mode of resolved.modes) {
    await exportProfile(mode);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
