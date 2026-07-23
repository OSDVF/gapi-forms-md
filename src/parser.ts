import { forms_v1 } from '@googleapis/forms';

type Schema$Form = forms_v1.Schema$Form;
type Schema$Item = forms_v1.Schema$Item;
type Schema$Question = forms_v1.Schema$Question;
type Schema$Option = forms_v1.Schema$Option;
type Schema$Info = forms_v1.Schema$Info;

export function parseMarkdown(markdown: string, formId: string): Schema$Form {
  const lines = markdown.split('\n');
  const items: Schema$Item[] = [];
  let formTitle = '';
  let formDescription = '';
  let confirmationMessage = '';
  let inConfirmationMessage = false;

  let currentItem: Partial<Schema$Item> | null = null;
  let currentQuestion: Partial<Schema$Question> | null = null;
  let currentOptions: Schema$Option[] = [];
  let currentDescription: string[] = [];

  let itemIdCounter = 0;
  let questionIdCounter = 0;

  function genItemId() {
    return `item_${itemIdCounter++}`;
  }

  function genQuestionId() {
    return `question_${questionIdCounter++}`;
  }

  function flushItem() {
    if (currentItem) {
      if (currentQuestion) {
        if (currentDescription.length > 0) {
          currentItem.description = currentDescription.join('\n').trim();
        }

        items.push(currentItem as Schema$Item);
      } else if (currentItem.pageBreakItem || currentItem.textItem || currentItem.imageItem) {
        if (currentDescription.length > 0) {
          currentItem.description = currentDescription.join('\n').trim();
        }
        items.push(currentItem as Schema$Item);
      }
      currentItem = null;
      currentQuestion = null;
      currentOptions = [];
      currentDescription = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '---') {
      flushItem();
      inConfirmationMessage = true;
      continue;
    }

    if (inConfirmationMessage) {
      confirmationMessage += line + '\n';
      continue;
    }

    if (line.startsWith('# ')) {
      flushItem();
      const title = line.substring(2).trim();
      if (!formTitle) {
        formTitle = title;
      } else {
        currentItem = {
          itemId: genItemId(),
          title: title,
          pageBreakItem: {}
        };
      }
      continue;
    }

    if (line.startsWith('## ')) {
      flushItem();
      let title = line.substring(3).trim();
      let required = false;
      if (title.endsWith('*')) {
        required = true;
        title = title.substring(0, title.length - 1).trim();
      }

      currentItem = {
        itemId: genItemId(),
        title: title,
      };
      currentQuestion = {
        questionId: genQuestionId(),
        required: required,
      };
      currentItem.questionItem = {
        question: currentQuestion as Schema$Question
      };
      continue;
    }

    if (line.startsWith('> ')) {
      const content = line.substring(2).trim();
      if (content.startsWith('## ')) {
        flushItem();
        currentItem = {
          itemId: genItemId(),
          title: content.substring(3).trim(),
          textItem: {}
        };
      } else {
        if (currentItem && currentItem.textItem) {
          currentDescription.push(content);
        }
      }
      continue;
    }

    if (line.startsWith('![')) {
      const match = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        const altText = match[1];
        const contentUri = match[2];
        
        if (currentItem && currentItem.questionItem) {
             currentItem.questionItem.image = { contentUri, altText };
        } else {
            flushItem();
            currentItem = {
                itemId: genItemId(),
                imageItem: {
                    image: { contentUri, altText }
                }
            };
        }
      }
      continue;
    }

    if (line.startsWith('- [ ] ')) {
      if (currentQuestion) {
        if (!currentQuestion.choiceQuestion) {
          currentQuestion.choiceQuestion = {
            type: 'CHECKBOX',
            options: []
          };
        }
        let val = line.substring(6).trim();
        let isOther = false;
        if (val.endsWith(':')) {
            isOther = true;
            val = val.substring(0, val.length - 1).trim();
        }
        currentQuestion.choiceQuestion.options?.push({
          value: val,
        });
      }
      continue;
    }

    if (line.startsWith('- ')) {
      if (currentQuestion) {
        if (!currentQuestion.choiceQuestion) {
          currentQuestion.choiceQuestion = {
            type: 'RADIO',
            options: []
          };
        }
        let val = line.substring(2).trim();
        let goToSectionId: string | undefined;
        if (val.includes('->')) {
            const parts = val.split('->');
            val = parts[0].trim();
            goToSectionId = parts[1].trim();
        }
        currentQuestion.choiceQuestion.options?.push({
          value: val,
          goToAction: goToSectionId ? 'NEXT_SECTION' : undefined,
          goToSectionId: goToSectionId,
        });
      }
      continue;
    }

    if (line === '...' || line === '... ...') {
        if (currentQuestion) {
            if (!currentQuestion.textQuestion) {
                currentQuestion.textQuestion = { paragraph: line === '... ...' };
            } else if (line === '...') {
                currentQuestion.textQuestion.paragraph = true; 
            }
        }
        continue;
    }
    
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(line)) {
        if (currentQuestion) {
            currentQuestion.dateQuestion = { includeYear: true, includeTime: false };
        }
        continue;
    }

    if (line) {
      if (!formTitle) {
      } else if (!currentItem) {
        formDescription += line + '\n';
      } else {
        currentDescription.push(line);
      }
    }
  }

  flushItem();

  return {
    formId: formId,
    info: {
      title: formTitle,
      description: formDescription.trim(),
    },
    items: items,
    revisionId: '1',
    responderUri: `https://example.com/forms/${formId}/viewform`
  };
}
