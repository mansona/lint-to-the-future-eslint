import { Project } from 'fixturify-project';
import { join } from 'path';
import { readFileSync } from 'fs';

import { describe, it, expect } from 'vitest';

import { remove } from '../main.mjs';

async function setupProject(files) {
  const project = new Project({
    files: {
      '.eslintrc.json': '{"extends": "eslint:recommended"}',
      'package.json': `{
        "devDependencies": {
          "eslint": "^7.0.0"
        }
      }`,
      ...files,
    },
  });

  project.linkDevDependency('eslint', { baseDir: process.cwd() });
  await project.write();

  return project;
}

describe('remove function', function () {
  it('should remove lints covered by eslint', async function () {
    const project = await setupProject({
      'test.js': `/* eslint-disable face-lint, other-lint */
console.log('hello world');`,
    });

    remove({ name: 'face-lint' }, project.baseDir);

    expect(readFileSync(join(project.baseDir, 'test.js'), 'utf-8')).to
      .equal(`/* eslint-disable other-lint */
console.log('hello world');`);
  });

  it('should not remove lints from files not covered', async function () {
    const project = await setupProject({
      'test.hbs': `/* eslint-disable face-lint, other-lint */
console.log('hello world');`,
    });

    remove({ name: 'face-lint' }, project.baseDir);

    expect(readFileSync(join(project.baseDir, 'test.hbs'), 'utf-8')).to
      .equal(`/* eslint-disable face-lint, other-lint */
console.log('hello world');`);
  });

  it('should remove the whole line when the last one is removed', async function () {
    const project = await setupProject({
      'test.js': `/* eslint-disable face-lint */
console.log('hello world');`,
    });

    remove({ name: 'face-lint' }, project.baseDir);

    expect(readFileSync(join(project.baseDir, 'test.js'), 'utf-8')).to.equal(
      `console.log('hello world');`,
    );
  });

  it('should only remove lints from files covered by the filter', async function () {
    const project = await setupProject({
      'monkey.js': `/* eslint-disable face-lint, other-lint */
console.log('hello bananananana!');`,
      'test.js': `/* eslint-disable face-lint, other-lint */
console.log('hello world');`,
    });

    remove({ name: 'face-lint', filter: 't*.js' }, project.baseDir);

    expect(readFileSync(join(project.baseDir, 'test.js'), 'utf-8')).to
      .equal(`/* eslint-disable other-lint */
console.log('hello world');`);
    expect(readFileSync(join(project.baseDir, 'monkey.js'), 'utf-8')).to
      .equal(`/* eslint-disable face-lint, other-lint */
console.log('hello bananananana!');`);
  });

  it('should remove correctly from shebang files', async function () {
    const project = await setupProject({
      'test.js': `#! /usr/env node
/* eslint-disable face-lint, other-lint */
console.log('hello world');`,
    });

    remove({ name: 'face-lint', filter: 't*.js' }, project.baseDir);

    expect(readFileSync(join(project.baseDir, 'test.js'), 'utf-8')).to
      .equal(`#! /usr/env node
/* eslint-disable other-lint */
console.log('hello world');`);
  });
});
