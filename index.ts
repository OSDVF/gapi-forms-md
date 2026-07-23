import { parseMarkdown } from './src/parser';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const PORT = process.env.PORT || 3000;
const RESPONSES_DIR = join(process.cwd(), 'responses');

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
        const content = await readFile(join(process.cwd(), filename), 'utf-8');
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
        const files = await readdir(process.cwd());
        const mdFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
        const forms = await Promise.all(mdFiles.map(async f => {
          const content = await readFile(join(process.cwd(), f), 'utf-8');
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

console.log(`Server running at http://localhost:${server.port}`);
