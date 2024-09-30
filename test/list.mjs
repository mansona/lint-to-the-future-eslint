import { expect } from 'chai';
import { Project } from 'fixturify-project';

// eslint-disable-next-line import/extensions
import { list } from '../index.js';

describe('list function', function () {
  it('should output object with rules and files', async function () {
    const project = new Project({
      files: {
        'index.js': `/* eslint-disable no-unused-vars, prefer-const, quotes, semi  */
let unused = 'face';

let b = () => {};
`,
        'next-line-ignore.js': `/* eslint-disable no-unused-vars, quotes, semi */
const unused = 'face';

// eslint-disable-next-line prefer-const
let b = () => {};
`,
      },
    });

    await project.write();

    const cwd = process.cwd();

    process.chdir(project.baseDir);
    const result = list('./');
    process.chdir(cwd);

    expect(result).to.deep.equal({
      'no-unused-vars': ['index.js', 'next-line-ignore.js'],
      'prefer-const': ['index.js'],
      quotes: ['index.js', 'next-line-ignore.js'],
      semi: ['index.js', 'next-line-ignore.js'],
    });
  });
});
