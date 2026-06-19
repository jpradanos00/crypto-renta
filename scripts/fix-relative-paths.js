#!/usr/bin/env node
/**
 * Post-build script: converts absolute paths to relative paths
 * in all HTML files so they work when opened via file:// or
 * served from a subdirectory.
 */
const fs = require("fs");
const path = require("path");

const DIST_DIR = path.resolve(__dirname, "../dist");

function getRelativePrefix(filePath) {
  const relative = path.relative(DIST_DIR, filePath);
  const depth = relative.split(path.sep).length - 1;
  return depth === 0 ? "." : Array(depth).fill("..").join("/");
}

function fixHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const prefix = getRelativePrefix(filePath);

  // Replace absolute paths with relative ones
  content = content.replace(/src="\/_next\//g, `src="${prefix}/_next/`);
  content = content.replace(/href="\/_next\//g, `href="${prefix}/_next/`);
  content = content.replace(/href="\/"/g, `href="${prefix}/index.html"`);
  content = content.replace(/href="\/calculadora"/g, `href="${prefix}/calculadora.html"`);
  content = content.replace(/href="\/guia"/g, `href="${prefix}/guia.html"`);

  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${path.relative(DIST_DIR, filePath)}`);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (entry.endsWith(".html")) {
      fixHtmlFile(fullPath);
    }
  }
}

walk(DIST_DIR);
console.log("Done. All HTML files now use relative paths.");
