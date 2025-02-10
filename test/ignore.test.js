import { Project } from 'fixturify-project';

import { describe, it, expect } from 'vitest';

import { ignoreAll } from '../main.mjs';

async function ignoreTestFile(input, files, options) {
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
  await ignoreAll(options ?? {}, project.baseDir);

  project.readSync(project.baseDir);
  return project.files;
}

describe('ignore function', function () {
  it('should not crash with ^ in eslint dependency', async function () {
    expect((await ignoreTestFile(`debugger`))['index.js']).to
      .equal(`/* eslint-disable no-debugger */
debugger`);
  });

  it('should handle files with invalid `// eslint-disable` comments at the top', async function () {
    expect(
      (await ignoreTestFile(`// eslint-disable no-debugger
debugger`))['index.js'],
    ).to.equal(`/* eslint-disable no-debugger */
// eslint-disable no-debugger
debugger`);
  });

  it('should add to existing `/* eslint-disable` comments', async function () {
    expect(
      (await ignoreTestFile(`/* eslint-disable no-console, no-undef */
debugger
console.log('test')`))['index.js'],
    ).to.equal(`/* eslint-disable no-console, no-debugger, no-undef */
debugger
console.log('test')`);
  });

  it('handles `// eslint-disable-next-line` at the top of the file correctly', async function () {
    expect(
      (await ignoreTestFile(`/* eslint-disable-next-line no-debugger */
debugger
console.log('test')`))['index.js'],
    ).to.equal(`/* eslint-disable no-undef */
/* eslint-disable-next-line no-debugger */
debugger
console.log('test')`);
  });

  it('handles rules with slashes in the name', async function () {
    expect(
      (await ignoreTestFile(`/* eslint-disable ember/no-observers */
debugger`))['index.js'],
    ).to.equal(`/* eslint-disable ember/no-observers, no-debugger */
debugger`);
  });

  it('does not add ignores for warnings reported by eslint', async function () {
    expect(
      (await ignoreTestFile(
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
      ))['index.js'],
    ).to.equal(`/* eslint-disable no-debugger */
debugger

if (10 === 'false') {
  // something
}`);
  });

  it('does the right thing with hash-bang/shebang files', async function () {
    expect(
      (await ignoreTestFile(`#!/usr/bin/env node
debugger`))['index.js'],
    ).to.equal(`#!/usr/bin/env node
/* eslint-disable no-debugger */
debugger`);

    expect(
      (await ignoreTestFile(`#!/usr/bin/env node
/* eslint-disable some-other-lint */
debugger`))['index.js'],
    ).to.equal(`#!/usr/bin/env node
/* eslint-disable no-debugger, some-other-lint */
debugger`);
  });

  it('supports ignore filter correctly', async function() {
    const files = await ignoreTestFile(``, {
      'ignore-me.js': 'debugger',
      'update-me.js': 'debugger',
      'update-me-too.js': 'debugger',
    }, {
      filter: 'update*.js'
    });

    expect(files).toMatchInlineSnapshot(`
      {
        ".eslintrc.json": "{"extends": "eslint:recommended"}",
        "eslint.config.js": "const js = require("@eslint/js");

      module.exports = [
          js.configs.recommended,
      ];",
        "ignore-me.js": "debugger",
        "index.js": "",
        "update-me-too.js": "/* eslint-disable no-debugger */
      debugger",
        "update-me.js": "/* eslint-disable no-debugger */
      debugger",
      }
    `)
  })
});
