import type { GenerationResult, UserStory } from './types.js';

/**
 * Thin wrapper around the Anthropic Messages API.
 *
 * The model is asked to return strict JSON so the output can feed
 * downstream tooling (test management imports, coverage reports, etc.).
 *
 * Requires an ANTHROPIC_API_KEY environment variable.
 */
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are a senior QA engineer specialised in functional analysis and shift-left testing.
Given a user story and its acceptance criteria, you:
1. Identify ambiguities, missing edge cases and untestable criteria.
2. Derive a focused set of test cases covering positive, negative, edge and boundary scenarios.

Respond with STRICT JSON only, no markdown, matching this shape:
{
  "observations": string[],
  "testCases": [
    {
      "id": string,
      "title": string,
      "type": "positive" | "negative" | "edge" | "boundary",
      "priority": "high" | "medium" | "low",
      "preconditions": string,
      "steps": string[],
      "expectedResult": string
    }
  ]
}`;

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicTextBlock[];
}

export async function generateTestCases(
  story: UserStory,
): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set.');
  }

  const userPrompt = [
    `Story ID: ${story.id}`,
    `Story: ${story.story}`,
    'Acceptance criteria:',
    ...story.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`),
  ].join('\n');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Anthropic API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as AnthropicResponse;
  const text = data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .replace(/```json|```/g, '')
    .trim();

  const parsed = JSON.parse(text) as Omit<GenerationResult, 'storyId'>;
  return { storyId: story.id, ...parsed };
}
