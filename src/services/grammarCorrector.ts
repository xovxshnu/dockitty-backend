import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Corrects grammar using OpenAI's GPT model.
 * @param text Raw user text
 * @returns Corrected text
 */
export const correctTextWithAI = async (text: string): Promise<string> => {
  try {
    const prompt = `Correct the grammar, punctuation, and clarity of the following text:\n\n${text}`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const correctedText = response.data.choices[0].message?.content?.trim();
    return correctedText || text;
  } catch (error) {
    console.error('OpenAI correction failed:', error);
    return text; // Return original text on failure
  }
};
