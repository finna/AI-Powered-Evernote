import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { notes } = req.body;

    const prompt = `Summarize the following notes:\n\n${notes.map((note: any) => `Title: ${note.title}\nContent: ${note.content}\n`).join('\n')}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = completion.choices[0].message.content;

    res.status(200).json({ summary });
  } catch (error) {
    console.error('Error in summarize API:', error);
    res.status(500).json({ message: 'Error summarizing notes' });
  }
}