/**
 * Shared utilities for handling Svelte files with eslint-disable comments.
 */

import { parse } from 'svelte/compiler';

export const ESLINT_DISABLE_REGEX = /eslint-disable (.*)\*\//;

/**
 * Parse the rules from an eslint-disable comment match.
 * @param {RegExpMatchArray} matched - The regex match result
 * @returns {string[]} Array of rule IDs
 */
export function parseRulesFromMatch(matched) {
  return matched[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Get the content of a script tag from a file.
 * @param {string} file - The full file content
 * @param {{ start: number, end: number }} script - The script tag AST node with start/end positions
 * @returns {{ scriptOpenEnd: number, scriptContent: string, contentLines: string[] }}
 */
export function getScriptContent(file, script) {
  const scriptOpenEnd = file.indexOf('>', script.start) + 1;
  const scriptContent = file.slice(scriptOpenEnd, script.end);
  const contentLines = scriptContent.split('\n');
  return { scriptOpenEnd, scriptContent, contentLines };
}

/**
 * Find the first non-empty line in an array of lines.
 * @param {string[]} lines - Array of lines
 * @returns {{ index: number, line: string | undefined }}
 */
export function findFirstNonEmptyLine(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      return { index: i, line: lines[i] };
    }
  }
  return { index: 0, line: undefined };
}

/**
 * Check if a script tag has an eslint-disable comment and get the rules if so.
 * @param {string} file - The full file content
 * @param {{ start: number, end: number }} script - The script tag AST node
 * @returns {{ hasDisable: boolean, rules: string[] }}
 */
export function getScriptDisableInfo(file, script) {
  const { contentLines } = getScriptContent(file, script);
  const { line } = findFirstNonEmptyLine(contentLines);

  if (!line) {
    return { hasDisable: false, rules: [] };
  }

  const matched = line.match(ESLINT_DISABLE_REGEX);
  if (matched) {
    return { hasDisable: true, rules: parseRulesFromMatch(matched) };
  }

  return { hasDisable: false, rules: [] };
}

/**
 * Try to parse a Svelte file and return the AST (sync version).
 * Returns null if parsing fails.
 * @param {string} file - The file content
 * @param {string} filename - The filename for error messages
 * @returns {{ instance: { start: number, end: number } | null, module: { start: number, end: number } | null } | null}
 */
export function parseSvelteFileSync(file, filename) {
  try {
    return parse(file, {
      filename,
      modern: true,
      loose: true,
    });
  } catch {
    return null;
  }
}
