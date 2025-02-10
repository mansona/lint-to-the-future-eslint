import importCwd from 'import-cwd';
import { readFileSync, writeFileSync } from 'fs';

function ignoreError(error) {
  const ruleIds = error.messages.map((message) => message.ruleId);
  let uniqueIds = [...new Set(ruleIds)].sort((a, b) => a.localeCompare(b));

  const file = readFileSync(error.filePath, 'utf8');

  const splitFile = file.split('\n');

  let firstLine = splitFile[0];

  // shebang https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line
  let shebangFile = firstLine.startsWith('#!');

  // the logical first line of the file is after the shebang
  if (shebangFile) {
    firstLine = splitFile[1];
  }

  // The whitespace after `eslint-disable` is important so `eslint-disable-next-line` and variants
  // aren't picked up.
  const matched = firstLine.match(/eslint-disable (.*)\*\//);

  if (matched) {
    const existing = matched[1].split(',').map((item) => item.trim());
    uniqueIds = [...new Set([...ruleIds, ...existing])].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  splitFile.splice(
    shebangFile ? 1 : 0, // if it's a shebangFile we start at the 2nd line of the file
    matched ? 1 : 0, // if it's already got an eslint-disable we replace the line (i.e. delete one line before splicing)
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
  const { ESLint } = eslint;
  cli = new ESLint({
    cwd,
  });
  results = await cli.lintFiles([filter ?? cwd]);

  // remove warnings
  results = ESLint.getErrorResults(results);

  const errors = results.filter((result) => result.errorCount > 0);

  errors.forEach(ignoreError);
};
