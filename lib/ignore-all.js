const { join } = require('path');
const importCwd = require('import-cwd');
const semver = require('semver');
const { readFileSync, writeFileSync } = require('fs');

function ignoreError(error) {
  const ruleIds = error.messages.map((message) => message.ruleId);
  let uniqueIds = [...new Set(ruleIds)];

  const file = readFileSync(error.filePath, 'utf8');

  const firstLine = file.split('\n')[0];

  // The whitespace after `eslint-disable` is important so `eslint-disable-next-line` and variants
  // aren't picked up.
  const matched = firstLine.match(/eslint-disable (.*)\*\//);

  if (matched) {
    const existing = matched[1].split(',').map((item) => item.trim());
    uniqueIds = [...new Set([...ruleIds, ...existing])];
    uniqueIds.sort((a, b) => a.localeCompare(b));

    writeFileSync(
      error.filePath,
      file.replace(/^.*\n/, `/* eslint-disable ${uniqueIds.join(', ')} */\n`),
    );
  } else {
    uniqueIds.sort((a, b) => a.localeCompare(b));
    writeFileSync(
      error.filePath,
      `/* eslint-disable ${uniqueIds.join(', ')} */\n${file}`,
    );
  }
}

module.exports = async function ignoreAll(cwd = process.cwd()) {
  const currentPackageJSON = require(join(cwd, 'package.json'));

  const eslintVersion = currentPackageJSON.devDependencies.eslint;

  let cli;
  let report;
  let results;

  const eslint = importCwd('eslint');

  if (semver.intersects(eslintVersion, '8')) {
    // this won't use the version in the repo but it will still use v8 because
    // that is installed in this repo
    const { ESLint } = eslint;
    cli = new ESLint();
    results = await cli.lintFiles([cwd]);

    // remove warnings
    results = ESLint.getErrorResults(results);
  } else {
    const { CLIEngine, ESLint } = eslint;
    cli = new CLIEngine();
    report = cli.executeOnFiles([cwd]);
    results = report.results;

    // remove warnings
    results = ESLint.getErrorResults(results);
  }

  const errors = results.filter((result) => result.errorCount > 0);

  errors.forEach(ignoreError);
};
