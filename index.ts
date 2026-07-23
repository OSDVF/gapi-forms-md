import { parseMarkdown } from './src/parser';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const PORT = process.env.PORT || 3000;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // GET /v1/forms/:formId
    const formMatch = path.match(/^\/v1\/forms\/([^/]+)$/);
    if (formMatch && req.method === 'GET') {
      const formId = formMatch[1];
      const filename = `${formId}.md`;
      try {
        const content = await readFile(join(process.cwd(), filename), 'utf-8');
        const form = parseMarkdown(content, formId);
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
        const files = await readdir(process.cwd());
        const mdFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
        const forms = await Promise.all(mdFiles.map(async f => {
          const content = await readFile(join(process.cwd(), f), 'utf-8');
          const formId = f.replace('.md', '');
          return parseMarkdown(content, formId);
        }));
        return Response.json({ forms });
      } catch (e) {
        return new Response('Error listing forms', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
