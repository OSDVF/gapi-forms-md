import { parseMarkdown } from './src/parser';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync, statSync } from 'node:fs';

const PORT = process.env.PORT || 3000;
const argv = process.argv.slice(2);
let DATA_ROOT = process.env.MARKDOWN_ROOT || process.cwd();
const argIndex = argv.findIndex(a => a === '--data-root' || a === '-d');
if (argIndex !== -1 && argv[argIndex + 1]) {
  DATA_ROOT = resolve(argv[argIndex + 1]);
}
// --help / -h
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('Usage: bun index.ts [--data-root|-d <path>]');
  console.log('Environment variable: MARKDOWN_ROOT (optional)');
  console.log('Examples:');
  console.log('  bun index.ts --data-root ./markdowns');
  console.log('  MARKDOWN_ROOT=/path/to/md bun index.ts');
  process.exit(0);
}

// Validate DATA_ROOT exists and is a directory
if (!existsSync(DATA_ROOT)) {
  console.error(`Data root "${DATA_ROOT}" does not exist.`);
  console.error('Specify a valid directory with --data-root or MARKDOWN_ROOT. Example: bun index.ts --data-root /path/to/markdowns');
  process.exit(1);
}
try {
  const st = statSync(DATA_ROOT);
  if (!st.isDirectory()) {
    console.error(`Data root "${DATA_ROOT}" is not a directory.`);
    process.exit(1);
  }
} catch (e) {
  console.error(`Unable to stat data root "${DATA_ROOT}": ${e}");
  process.exit(1);
}

const RESPONSES_DIR = join(DATA_ROOT, 'responses');

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // POST /v1/forms/:formId/responses
    const postResponseMatch = path.match(/^\/v1\/forms\/([^/]+)\/responses$/);
    if (postResponseMatch && postResponseMatch[1] && req.method === 'POST') {
      const formId = postResponseMatch[1];
      const response = await req.json();
      const responseId = `resp_${Date.now()}`;

      await mkdir(join(RESPONSES_DIR, formId), { recursive: true });
      await writeFile(
        join(RESPONSES_DIR, formId, `${responseId}.json`),
        JSON.stringify({ ...(response as object), responseId }, null, 2)
      );

      return Response.json({ responseId });
    }

    // GET /v1/forms/:formId/responses
    const listResponsesMatch = path.match(/^\/v1\/forms\/([^/]+)\/responses$/);
    if (listResponsesMatch && listResponsesMatch[1] && req.method === 'GET') {
      const formId = listResponsesMatch[1];
      try {
        const files = await readdir(join(RESPONSES_DIR, formId));
        const responses = await Promise.all(
          files.map(async (f) => JSON.parse(await readFile(join(RESPONSES_DIR, formId, f), 'utf-8')))
        );
        return Response.json({ responses });
      } catch (e) {
        return Response.json({ responses: [] });
      }
    }
    // GET /v1/forms/:formId
    const formMatch = path.match(/^\/v1\/forms\/([^/]+)$/);
    if (formMatch && formMatch[1] && req.method === 'GET') {
      const formId = formMatch[1];
      const filename = `${formId}.md`;
      try {
        const content = await readFile(join(DATA_ROOT, filename), 'utf-8');
        const form = await parseMarkdown(content, formId); // Updated to await AST parser
        return Response.json(form);
      } catch (e) {
        return new Response('Form not found', { status: 404 });
      }
    }

    // GET /v1/forms/:formId/responses
    const responsesMatch = path.match(/^\/v1\/forms\/([^/]+)\/responses$/);
    if (responsesMatch && req.method === 'GET') {
      return Response.json({ responses: [] });
    }

    // GET /v1/forms/:formId/responses/:responseId
    const responseMatch = path.match(/^\/v1\/forms\/([^/]+)\/responses\/([^/]+)$/);
    if (responseMatch && req.method === 'GET') {
        return new Response('Response not found', { status: 404 });
    }

    // GET /v1/forms (List all forms - custom addition)
    if (path === '/v1/forms' && req.method === 'GET') {
      try {
        const files = await readdir(DATA_ROOT);
        const mdFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
        const forms = await Promise.all(mdFiles.map(async f => {
          const content = await readFile(join(DATA_ROOT, f), 'utf-8');
          const formId = f.replace('.md', '');
          return await parseMarkdown(content, formId); // Updated to await AST parser
        }));
        return Response.json({ forms });
      } catch (e) {
        return new Response('Error listing forms', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port} (data root: ${DATA_ROOT})`);
