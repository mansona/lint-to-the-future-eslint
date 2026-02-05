import { Project } from 'fixturify-project';
import { describe, it, expect } from 'vitest';
import { ignoreAll } from '../main.mjs';

async function ignoreSvelteTestFile(svelteContent, additionalFiles = {}) {
  const project = new Project({
    files: {
      'eslint.config.js': `
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";

export default [
  js.configs.recommended,
  ...svelte.configs["flat/recommended"],
];`,
      'Component.svelte': svelteContent,
      'package.json': `{
        "devDependencies": {
          "eslint": "^9.0.0",
          "eslint-plugin-svelte": "^2.0.0"
        }
      }`,
      ...additionalFiles,
    },
  });

  project.linkDevDependency('eslint', { baseDir: process.cwd() });
  project.linkDevDependency('@eslint/js', { baseDir: process.cwd() });
  project.linkDevDependency('eslint-plugin-svelte', { baseDir: process.cwd() });
  project.linkDevDependency('svelte', { baseDir: process.cwd() });
  await project.write();
  await ignoreAll({}, project.baseDir);

  project.readSync(project.baseDir);
  return project.files;
}

describe('svelte ignore function', function () {
  it('should add script tag with disable when no script exists', async function () {
    const files = await ignoreSvelteTestFile(`<div>{undefinedVar}</div>`);
    expect(files['Component.svelte']).to.equal(`<script>
/* eslint-disable no-undef */
</script>
<div>{undefinedVar}</div>`);
  });

  it('should add disable to existing instance script', async function () {
    const files = await ignoreSvelteTestFile(`<script>
let x = undefinedVar;
</script>
<div>{x}</div>`);
    expect(files['Component.svelte']).to.equal(`<script>
/* eslint-disable no-undef */
let x = undefinedVar;
</script>
<div>{x}</div>`);
  });

  it('should add disable to existing module script when only module script exists', async function () {
    const files = await ignoreSvelteTestFile(`<script context="module">
export let x = undefinedVar;
</script>
<div>test</div>`);
    expect(files['Component.svelte']).to.equal(`<script context="module">
/* eslint-disable no-undef */
export let x = undefinedVar;
</script>
<div>test</div>`);
  });

  it('should merge with existing disable comment in script', async function () {
    const files = await ignoreSvelteTestFile(`<script>
/* eslint-disable no-console */
let x = undefinedVar;
console.log(x);
</script>
<div>{x}</div>`);
    expect(files['Component.svelte']).to.equal(`<script>
/* eslint-disable no-console, no-undef */
let x = undefinedVar;
console.log(x);
</script>
<div>{x}</div>`);
  });

  it('should add to module script when both scripts exist and neither has disable', async function () {
    const files = await ignoreSvelteTestFile(`<script context="module">
export const foo = "bar";
</script>
<script>
let x = undefinedVar;
</script>
<div>{x}</div>`);
    expect(files['Component.svelte']).to.equal(`<script context="module">
/* eslint-disable no-undef */
export const foo = "bar";
</script>
<script>
let x = undefinedVar;
</script>
<div>{x}</div>`);
  });

  it('should add to instance script when both exist and instance has disable', async function () {
    const files = await ignoreSvelteTestFile(`<script context="module">
export const foo = "bar";
</script>
<script>
/* eslint-disable no-console */
let x = undefinedVar;
</script>
<div>{x}</div>`);
    expect(files['Component.svelte']).to.equal(`<script context="module">
export const foo = "bar";
</script>
<script>
/* eslint-disable no-console, no-undef */
let x = undefinedVar;
</script>
<div>{x}</div>`);
  });

  it('should add to module script when both exist and module has disable', async function () {
    const files = await ignoreSvelteTestFile(`<script context="module">
/* eslint-disable no-console */
export const foo = undefinedVar;
</script>
<script>
let x = 1;
</script>
<div>{x}</div>`);
    expect(files['Component.svelte']).to.equal(`<script context="module">
/* eslint-disable no-console, no-undef */
export const foo = undefinedVar;
</script>
<script>
let x = 1;
</script>
<div>{x}</div>`);
  });
});
