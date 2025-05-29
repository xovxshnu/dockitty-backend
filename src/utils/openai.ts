import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const correctGrammar = async (text: string) => {
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a grammar correction assistant.' },
      { role: 'user', content: `Correct this: ${text}` },
    ],
  });

  return res.choices[0].message?.content || '';
};
