import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    const prompt = `Summarize the following notes:\n\n${notes.map((note: any) => `Title: ${note.title}\nContent: ${note.content}\n`).join('\n')}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = completion.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json({ message: 'Error summarizing notes' }, { status: 500 });
  }
}