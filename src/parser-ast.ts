import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Heading, List, ListItem, Paragraph, Image } from 'mdast';
import { forms_v1 } from '@googleapis/forms';

export async function parseMarkdown(markdown: string, formId: string): Promise<forms_v1.Schema$Form> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const ast = processor.parse(markdown);
  const items: forms_v1.Schema$Item[] = [];
  let formTitle = '';
  let formDescription = '';

  let itemIdCounter = 0;
  let questionIdCounter = 0;

  function genItemId() { return `item_${itemIdCounter++}`; }
  function genQuestionId() { return `question_${questionIdCounter++}`; }

  let currentQuestion: forms_v1.Schema$Question | null = null;
  let currentList: forms_v1.Schema$Option[] = [];

  visit(ast, (node) => {
    if (node.type === 'heading') {
      const heading = node as Heading;
      const text = (heading.children[0] as any)?.value || '';

      if (heading.depth === 1) {
        if (!formTitle) {
          formTitle = text;
          // Create an implicit starting pageBreakItem to catch default section navigation rules on page 1
          items.push({ itemId: genItemId(), title: text, pageBreakItem: {} });
        } else {
          items.push({ itemId: genItemId(), title: text, pageBreakItem: {} });
        }
      } else if (heading.depth === 2) {
        const required = text.endsWith('*');
        const title = required ? text.slice(0, -1).trim() : text;
        const question: forms_v1.Schema$Question = { questionId: genQuestionId(), required };
        items.push({
          itemId: genItemId(),
          title,
          questionItem: { question }
        });
        currentQuestion = question;
      }
    } else if (node.type === 'paragraph') {
      const p = node as Paragraph;
      const text = (p.children[0] as any)?.value || '';
      
      if (text.startsWith('->')) {
        const destSection = text.replace('->', '').trim();
        // Since first page break is implicitly the form header, 
        // if no pageBreakItem exists yet, we create a navigation rule on the form header or wait.
        // Let's set it on the preceding PageBreakItem or attach it contextually.
        const pageBreaks = items.filter(item => !!item.pageBreakItem);
        if (pageBreaks.length > 0) {
            const pageBreak = pageBreaks[pageBreaks.length - 1];
            if (pageBreak) {
                pageBreak.pageBreakItem = { 
                    goToSectionId: destSection 
                };
            }
        } else {
            // No explicit section breaks yet (means we are on the first default page).
            // In Google Forms, default navigation for page 1 is not easily represented unless we have an item.
            // But we can store it as metadata on a dummy initial pageBreakItem if needed.
        }
      }
    } else if (node.type === 'list' && currentQuestion) {
      const list = node as List;
      // Check if it's a checkbox list by looking for a checkbox in the items
      const isCheckbox = list.children.some(li => {
        const text = (li.children[0] as any)?.children?.[0]?.value || '';
        // Look for the specific GFM list item checkbox status
        return (li as any).checked !== null && (li as any).checked !== undefined;
      });

      const options: forms_v1.Schema$Option[] = list.children.map((li) => {
          let text = (li.children[0] as any)?.children?.[0]?.value || '';
          return { value: text.trim() };
      });

      currentQuestion.choiceQuestion = {
          type: isCheckbox ? 'CHECKBOX' : (list.ordered ? 'DROP_DOWN' : 'RADIO'),
          options
      };
    } else if (node.type === 'image' && currentQuestion) {
        const img = node as Image;
        // In the official Schema, 'image' belongs to QuestionItem, not Question
        // We need to find the parent QuestionItem to set the image
        const lastItem = items[items.length - 1];
        if (lastItem && lastItem.questionItem) {
            lastItem.questionItem.image = { contentUri: img.url };
        }
    }
  });

  return {
    formId,
    info: { title: formTitle, description: formDescription },
    items,
    revisionId: '1'
  };
}
