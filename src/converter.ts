import { forms_v1 } from '@googleapis/forms';

export function convertFormToMarkdown(form: forms_v1.Schema$Form): string {
    let markdown = `# ${form.info?.title || 'Untitled Form'}\n`;
    if (form.info?.description) {
        markdown += `${form.info.description}\n\n`;
    }

    for (const item of (form.items || [])) {
        if (item.title) {
            const required = item.questionItem?.question?.required ? '*' : '';
            markdown += `## ${item.title}${required}\n`;
        }

        if (item.questionItem?.question?.choiceQuestion) {
            const cq = item.questionItem.question.choiceQuestion;
            cq.options?.forEach(opt => {
                const prefix = cq.type === 'CHECKBOX' ? '- [ ] ' : '- ';
                markdown += `${prefix}${opt.value}\n`;
            });
        }

        if (item.questionItem?.question?.scaleQuestion) {
            const sq = item.questionItem.question.scaleQuestion;
            markdown += `${sq.low}-${sq.high} (${sq.lowLabel} - ${sq.highLabel})\n`;
        }

        if (item.questionItem?.question?.dateQuestion) {
          markdown += '31.1.2025\n'; // Placeholder for date
        }

        if (item.questionItem?.question?.textQuestion) {
            markdown += item.questionItem.question.textQuestion.paragraph ? '... ...\n' : '...\n';
        }

        if (item.pageBreakItem) {
            markdown += '\n# \n';
        }

        if (item.imageItem) {
            markdown += `![Image](${item.imageItem.image?.contentUri})\n`;
        }

        markdown += '\n';
    }

    return markdown;
}
