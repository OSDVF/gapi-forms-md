import { parseMarkdown } from './src/parser-ast';
import { readFile } from 'node:fs/promises';

async function test() {
  const content = await readFile('feedback-form.md', 'utf-8');
  const form = parseMarkdown(content, 'feedback-form');
  console.log(JSON.stringify(form, null, 2));
}

test();
