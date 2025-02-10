import { Project } from 'fixturify-project';

import { describe, it, expect } from 'vitest';

import { list } from '../main.mjs';

async function listFiles(files) {
  const project = new Project({
    files,
  });

  await project.write();

  const cwd = process.cwd();

  process.chdir(project.baseDir);
  const result = list('./');
  process.chdir(cwd);
  return result;
}

describe('list function', function () {
  it('should output object with rules and files', async function () {
    const result = await listFiles({
      'index.js': `/* eslint-disable no-unused-vars, prefer-const, quotes, semi  */
let unused = 'face';

let b = () => {};
`,
      'next-line-ignore.js': `/* eslint-disable no-unused-vars, quotes, semi */
const unused = 'face';

// eslint-disable-next-line prefer-const
let b = () => {};
`,
    });

    expect(result).to.deep.equal({
      'no-unused-vars': ['index.js', 'next-line-ignore.js'],
      'prefer-const': ['index.js'],
      quotes: ['index.js', 'next-line-ignore.js'],
      semi: ['index.js', 'next-line-ignore.js'],
    });
  });

  it('should list properly with hash-bang/shebang files', async function () {
    const result = await listFiles({
      'index.js': `#! /env/node
/* eslint-disable no-unused-vars  */
let unused = 'face';

let b = () => {};
`,
    });

    expect(result).to.deep.equal({
      'no-unused-vars': ['index.js'],
    });
  });

  it('should not report rule-less eslint-disable', async function () {
    const result = await listFiles({
      'index.js': `
  /* eslint-disable */
  let unused = 'face';

  let b = () => {};
  `,
    });

    expect(result).to.deep.equal({});
  });
});
