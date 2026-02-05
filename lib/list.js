import { readFileSync, lstatSync } from 'fs';
import { join, extname } from 'path';
import getFiles from './get-files.js';
import {
  ESLINT_DISABLE_REGEX,
  parseRulesFromMatch,
  getScriptDisableInfo,
  parseSvelteFileSync,
} from './svelte-utils.js';

/**
 * Get eslint-disable rules from a regular (non-Svelte) file.
 * @param {string} file - The file content
 */
function getRegularFileRules(file) {
  const splitFile = file.split('\n');
  let firstLine = splitFile[0];

  // shebang https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line
  let shebangFile = firstLine.startsWith('#!');

  // the logical first line of the file is after the shebang
  if (shebangFile) {
    firstLine = splitFile[1];
  }

  if (!firstLine.includes('eslint-disable ')) {
    return null;
  }

  const matched = firstLine.match(ESLINT_DISABLE_REGEX);
  if (!matched) {
    return null;
  }

  return parseRulesFromMatch(matched);
}

/**
 * Get eslint-disable rules from a Svelte file.
 * Checks both instance and module script tags.
 * @param {string} file - The file content
 * @param {string} filePath - The file path
 */
function getSvelteFileRules(file, filePath) {
  const ast = parseSvelteFileSync(file, filePath);

  if (!ast) {
    // Fall back to regular file handling if parsing fails
    return getRegularFileRules(file);
  }

  const rules = [];

  // Check instance script
  if (ast.instance) {
    const { hasDisable, rules: instanceRules } = getScriptDisableInfo(
      file,
      ast.instance,
    );
    if (hasDisable) {
      rules.push(...instanceRules);
    }
  }

  // Check module script
  if (ast.module) {
    const { hasDisable, rules: moduleRules } = getScriptDisableInfo(
      file,
      ast.module,
    );
    if (hasDisable) {
      rules.push(...moduleRules);
    }
  }

  return rules.length > 0 ? rules : null;
}

export default function list(cwd = process.cwd()) {
  const files = getFiles(cwd);

  const output = {};

  files.forEach((relativeFilePath) => {
    const filePath = join(cwd, relativeFilePath);
    // prevent odd times when directories might end with `.js` or `.ts`;
    if (!lstatSync(filePath).isFile()) {
      return;
    }

    const file = readFileSync(filePath, 'utf8');

    let rules;
    if (extname(filePath) === '.svelte') {
      rules = getSvelteFileRules(file, filePath);
    } else {
      rules = getRegularFileRules(file);
    }

    if (rules) {
      rules.forEach((rule) => {
        if (output[rule]) {
          output[rule].push(relativeFilePath);
        } else {
          output[rule] = [relativeFilePath];
        }
      });
    }
  });

  return output;
}
