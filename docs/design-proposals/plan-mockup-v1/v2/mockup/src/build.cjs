// Builds the self-contained mockup: inlines the ORIGINAL logo JPEG (read-only) as a CSS data URI.
// Usage (from repo root): .node/bin/node docs/design-proposals/plan-mockup-v1/v2/mockup/src/build.cjs
// No dependencies; does not touch frontend/ except reading the logo file.
const fs = require('fs');
const path = require('path');
const here = __dirname;
const repo = path.resolve(here, '../../../../../..');
const logo = fs.readFileSync(path.join(repo, 'frontend/public/brand/baoq-logo-original.jpg'));
const src = fs.readFileSync(path.join(here, 'baoq-mockup-v2.src.html'), 'utf8');
const style = `<style>:root{--logo:url("data:image/jpeg;base64,${logo.toString('base64')}")}</style>`;
if (!src.includes('<!--LOGO-STYLE-->')) throw new Error('placeholder missing');
const out = path.join(here, '..', 'baoq-mockup-v2.html');
fs.writeFileSync(out, src.replace('<!--LOGO-STYLE-->', style));
console.log('wrote', path.relative(repo, out), fs.statSync(out).size, 'bytes');
