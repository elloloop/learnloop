import { QuestionTemplate, GeneratedQuestion, VariableDefinition } from '@/types';

/**
 * Generate question instances locally using template logic
 */
export const generateLocalInstances = (
  template: QuestionTemplate,
  variationText: string,
  count: number
): GeneratedQuestion[] => {
  const instances: GeneratedQuestion[] = [];

  for (let i = 0; i < count; i++) {
    // 1. Generate Values
    const values: Record<string, any> = {};
    template.variables.forEach((v) => {
      if (v.type === 'number') {
        const min = v.min ?? 0;
        const max = v.max ?? 100;
        const val = Math.random() * (max - min) + min;
        const p = v.precision ?? 0;
        values[v.name] = Number(val.toFixed(p));
      } else if (v.type === 'choice' && v.options && v.options.length > 0) {
        values[v.name] =
          v.options[Math.floor(Math.random() * v.options.length)];
      } else {
        values[v.name] = 'sample';
      }
    });

    // 2. Calculate Answer
    let answer = 'N/A';
    if (template.answerFunction) {
      try {
        const fn = new Function('values', template.answerFunction);
        const result = fn(values);
        answer =
          typeof result === 'number'
            ? Number.isInteger(result)
              ? result.toString()
              : result.toFixed(2)
            : String(result);
      } catch (e) {
        console.error('Answer calculation error', e);
        answer = 'Error';
      }
    }

    // 3. Interpolate Template
    let qText = variationText;
    Object.keys(values).forEach((k) => {
      qText = qText.replace(new RegExp(`{${k}}`, 'g'), String(values[k]));
    });

    instances.push({
      id: crypto.randomUUID(),
      templateId: template.id,
      questionText: qText,
      values,
      concepts: template.concepts,
      curriculumTags: template.curriculumTags,
      calculatedAnswer: answer,
      status: 'pending',
      createdAt: new Date(),
      attemptCount: 0,
    });
  }

  return instances;
};

/**
 * Generate a unique hash for a question based on its values
 * This helps identify "same" questions with different variable values
 */
export const getQuestionHash = (values: Record<string, any>): string => {
  const sorted = Object.keys(values)
    .sort()
    .map((k) => `${k}:${values[k]}`)
    .join('|');
  return btoa(sorted).replace(/[^a-zA-Z0-9]/g, '');
};

