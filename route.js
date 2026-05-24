import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 10,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: image,
            },
          },
          {
            type: "text",
            text: "Is there a human face clearly visible in this image? Reply with exactly 'YES' or 'NO' and nothing else.",
          },
        ],
      }],
    });

    const reply = response.content[0].text.trim().toUpperCase();

    return NextResponse.json({
      detected: reply.includes("YES")
    });

  } catch (error) {
    return NextResponse.json(
      { detected: false, error: error.message },
      { status: 500 }
    );
  }
}