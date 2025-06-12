import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

export const correctGrammar = async (text: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a grammar correction assistant.",
        },
        {
          role: "user",
          content: `Correct the grammar of the following text:\n${text}`,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || "No correction found.";
  } catch (error) {
    console.error("Grammar correction failed:", error);
    return "Error: Grammar correction failed.";
  }
};
