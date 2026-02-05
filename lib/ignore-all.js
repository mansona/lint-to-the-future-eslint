import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { resolve, extname } from 'path';
import { cwd } from 'process';

import {
  ESLINT_DISABLE_REGEX,
  getScriptContent,
  findFirstNonEmptyLine,
  parseSvelteFile,
} from './svelte-utils.js';

function importCwd(moduleId) {
  const require = createRequire(resolve(cwd(), 'noop.js'));
  return require(moduleId);
}

/**
 * Check if a line has an existing eslint-disable comment and merge rule IDs if so.
 * @param {string | null} firstLine - The first line of content to check
 * @param {string[]} ruleIds - The new rule IDs to add
 */
function getDisableInfo(firstLine, ruleIds) {
  // The whitespace after `eslint-disable` is important so `eslint-disable-next-line` and variants
  // aren't picked up.
  const matched = firstLine?.match(ESLINT_DISABLE_REGEX);
  if (matched) {
    const existing = matched[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return {
      hasExisting: true,
      uniqueIds: [...new Set([...ruleIds, ...existing])].sort((a, b) =>
        a.localeCompare(b),
      ),
    };
  }
  return {
    hasExisting: false,
    uniqueIds: [...new Set(ruleIds)].sort((a, b) => a.localeCompare(b)),
  };
}

/**
 * Add or update an eslint-disable comment inside a script tag.
 * @param {string} file - The full file content
 * @param {{ start: number, end: number }} script - The script tag AST node with start/end positions
 * @param {string[]} ruleIds - The rule IDs to add
 */
function addDisableToScript(file, script, ruleIds) {
  const { scriptOpenEnd, contentLines } = getScriptContent(file, script);
  const { index: firstContentLineIndex, line: firstLine } =
    findFirstNonEmptyLine(contentLines);

  const { hasExisting, uniqueIds } = getDisableInfo(firstLine, ruleIds);
  const disableComment = `/* eslint-disable ${uniqueIds.join(', ')} */`;

  if (hasExisting) {
    // Replace the existing disable comment line
    contentLines[firstContentLineIndex] = disableComment;
  } else {
    // Insert the disable comment after the opening tag
    // We insert at index 1 to preserve any newline right after the opening tag
    if (contentLines[0] === '') {
      contentLines.splice(1, 0, disableComment);
    } else {
      contentLines.splice(0, 0, disableComment);
    }
  }

  const newContent = contentLines.join('\n');
  return file.slice(0, scriptOpenEnd) + newContent + file.slice(script.end);
}

/**
 * Check if a script tag already has an eslint-disable comment.
 * @param {string} file - The full file content
 * @param {{ start: number, end: number }} script - The script tag AST node
 */
function scriptHasDisable(file, script) {
  const { contentLines } = getScriptContent(file, script);
  const { line } = findFirstNonEmptyLine(contentLines);

  if (!line) {
    return false;
  }

  return ESLINT_DISABLE_REGEX.test(line);
}

async function ignoreError(error) {
  const ruleIds = error.messages
    .map((message) => message.ruleId)
    .filter(Boolean);

  const file = readFileSync(error.filePath, 'utf8');

  // special treatment for svelte files since we need to ignore within the script tag (or add one if it doesn't exist)
  if (extname(error.filePath) === '.svelte') {
    const ast = await parseSvelteFile(file, error.filePath);

    if (ast) {
      let modifiedFile;

      if (!ast.instance && !ast.module) {
        // if no script tags exist - create a new script tag at the start
        const { uniqueIds } = getDisableInfo(null, ruleIds);
        modifiedFile = `<script>\n/* eslint-disable ${uniqueIds.join(', ')} */\n</script>\n${file}`;
      } else if (ast.instance && !ast.module) {
        // if only instance script exists
        modifiedFile = addDisableToScript(file, ast.instance, ruleIds);
      } else if (!ast.instance && ast.module) {
        // if only module script exists
        modifiedFile = addDisableToScript(file, ast.module, ruleIds);
      } else {
        // if both exist - check for existing disable
        if (scriptHasDisable(file, ast.instance)) {
          // add to instance script where disable already exists
          modifiedFile = addDisableToScript(file, ast.instance, ruleIds);
        } else {
          // Neither has disable, or both have disable - prefer module script
          modifiedFile = addDisableToScript(file, ast.module, ruleIds);
        }
      }

      writeFileSync(error.filePath, modifiedFile);
      return; // Early return after handling Svelte
    }
    // If parsing fails, fall through to regular file handling
  }

  // Regular file handling
  const splitFile = file.split('\n');
  let firstLine = splitFile[0];

  // shebang https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line
  let shebangFile = firstLine.startsWith('#!');

  // the logical first line of the file is after the shebang
  if (shebangFile) {
    firstLine = splitFile[1];
  }

  const { hasExisting, uniqueIds } = getDisableInfo(firstLine, ruleIds);

  splitFile.splice(
    shebangFile ? 1 : 0, // if it's a shebangFile we start at the 2nd line of the file
    hasExisting ? 1 : 0, // if it's already got an eslint-disable we replace the line (i.e. delete one line before splicing)
    `/* eslint-disable ${uniqueIds.join(', ')} */`,
  );

  writeFileSync(error.filePath, splitFile.join('\n'));
}

export default async function ignoreAll({ filter } = {}, cwd = process.cwd()) {
  let cli;
  let results;

  const eslint = importCwd('eslint');

  // this won't use the version in the repo but it will still use v8 because
  // that is installed in this repo
  // Prefer flat-config aware loader when available (ESLint >= 8.56). Fallback to legacy constructor
  // for older ESLint, which is fine for .eslintrc-based projects.
  const hasLoadESLint = typeof eslint.loadESLint === 'function';
  const ESLint = hasLoadESLint
    ? await eslint.loadESLint({ cwd })
    : eslint.ESLint;
  cli = new ESLint({ cwd });
  results = await cli.lintFiles([filter ?? cwd]);

  // remove warnings
  const getErrorResults =
    ESLint.getErrorResults || (eslint.ESLint && eslint.ESLint.getErrorResults);
  results = getErrorResults ? getErrorResults(results) : results;

  const errors = results.filter((result) => result.errorCount > 0);

  await Promise.all(errors.map(ignoreError));
}
