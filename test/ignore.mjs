import { expect } from 'chai';
import { Project } from 'fixturify-project';
import { join } from 'path';
import { readFileSync } from 'fs';

import { ignoreAll } from '../index.js';

async function ignoreTestFile(input, files) {
  const project = new Project({
    files: {
      '.eslintrc.json': '{"extends": "eslint:recommended"}',
      //only for eslint 9
      'eslint.config.js': `const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
];`,
      'index.js': input,
      'package.json': `{
        "devDependencies": {
          "eslint": "^7.0.0"
        }
      }`,
      ...files,
    },
  });

  project.linkDevDependency('eslint', { baseDir: process.cwd() });
  project.linkDevDependency('@eslint/js', { baseDir: process.cwd() });
  await project.write();
  await ignoreAll(project.baseDir);

  return readFileSync(join(project.baseDir, 'index.js'), 'utf-8');
}

describe('ignore function', function () {
  it('should not crash with ^ in eslint dependency', async function () {
    expect(await ignoreTestFile(`debugger`)).to
      .equal(`/* eslint-disable no-debugger */
debugger`);
  });

  it('should handle files with invalid `// eslint-disable` comments at the top', async function () {
    expect(
      await ignoreTestFile(`// eslint-disable no-debugger
debugger`),
    ).to.equal(`/* eslint-disable no-debugger */
// eslint-disable no-debugger
debugger`);
  });

  it('should add to existing `/* eslint-disable` comments', async function () {
    expect(
      await ignoreTestFile(`/* eslint-disable no-console, no-undef */
debugger
console.log('test')`),
    ).to.equal(`/* eslint-disable no-console, no-debugger, no-undef */
debugger
console.log('test')`);
  });

  it('handles `// eslint-disable-next-line` at the top of the file correctly', async function () {
    expect(
      await ignoreTestFile(`/* eslint-disable-next-line no-debugger */
debugger
console.log('test')`),
    ).to.equal(`/* eslint-disable no-undef */
/* eslint-disable-next-line no-debugger */
debugger
console.log('test')`);
  });

  it('handles rules with slashes in the name', async function () {
    expect(
      await ignoreTestFile(`/* eslint-disable ember/no-observers */
debugger`),
    ).to.equal(`/* eslint-disable ember/no-observers, no-debugger */
debugger`);
  });

  it('does not add ignores for warnings reported by eslint', async function () {
    expect(
      await ignoreTestFile(
        `debugger

if (10 === 'false') {
  // something
}`,
        {
          '.eslintrc.json':
            '{"extends": "eslint:recommended", "rules": { "no-constant-condition": "warn" }}',
          //only for eslint 9
          'eslint.config.js': `const js = require("@eslint/js");

          module.exports = [
              js.configs.recommended,
              { rules: { "no-constant-condition": "warn" }}
          ];`,
        },
      ),
    ).to.equal(`/* eslint-disable no-debugger */
debugger

if (10 === 'false') {
  // something
}`);
  });

  it('does the right thing with hash-bang/shebang files', async function () {
    expect(
      await ignoreTestFile(`#!/usr/bin/env node
debugger`),
    ).to.equal(`#!/usr/bin/env node
/* eslint-disable no-debugger */
debugger`);

    expect(
      await ignoreTestFile(`#!/usr/bin/env node
/* eslint-disable some-other-lint */
debugger`),
    ).to.equal(`#!/usr/bin/env node
/* eslint-disable no-debugger, some-other-lint */
debugger`);
  });
});
