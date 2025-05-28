import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const correctGrammar = async (text: string) => {
  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a grammar correction assistant.' },
      { role: 'user', content: `Correct this: ${text}` },
    ],
  });

  return res.data.choices[0].message?.content || '';
};
