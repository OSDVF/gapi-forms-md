import { google } from 'googleapis';
import { convertFormToMarkdown } from './src/converter';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function syncFromRealForm(formId: string) {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/forms.body.readonly'],
  });

  const formsClient = google.forms({ version: 'v1', auth });

  console.log(`Fetching form ${formId} from Google...`);
  const res = await formsClient.forms.get({ formId });
  const form = res.data;

  // Use type assertion as we are interfacing with external library objects
  const markdown = convertFormToMarkdown(form as any);
  const outputPath = join(process.cwd(), `${formId}.md`);

  await writeFile(outputPath, markdown);
  console.log(`Form successfully saved to ${outputPath}`);
}

const formId = process.argv[2];
if (!formId) {
  console.error('Please provide a form ID');
  process.exit(1);
}

syncFromRealForm(formId).catch(console.error);
