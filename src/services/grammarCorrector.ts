import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function correctTextWithAI(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful grammar corrector.',
      },
      {
        role: 'user',
        content: `Correct this text: ${text}`,
      },
    ],
    model: 'gpt-4', // or gpt-3.5-turbo
  });

  return response.choices[0].message.content || text;
}
