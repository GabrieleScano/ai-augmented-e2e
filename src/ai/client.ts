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
    .join('');

  return parseGenerationResult(text, story.id);
}

const TEST_TYPES = ['positive', 'negative', 'edge', 'boundary'];
const PRIORITIES = ['high', 'medium', 'low'];

/**
 * Parse and validate the model's response into a GenerationResult.
 *
 * The model is asked for strict JSON, but we never trust it blindly:
 * markdown fences are stripped and the shape is validated, so malformed
 * output fails loudly here instead of corrupting downstream tooling.
 * Exported so it can be unit-tested without a network call.
 */
export function parseGenerationResult(
  rawText: string,
  storyId: string,
): GenerationResult {
  const text = rawText.replace(/```json|```/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('AI response was not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI response was not a JSON object.');
  }
  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.observations) || !obj.observations.every((o) => typeof o === 'string')) {
    throw new Error('AI response "observations" must be an array of strings.');
  }
  if (!Array.isArray(obj.testCases)) {
    throw new Error('AI response "testCases" must be an array.');
  }

  obj.testCases.forEach((tc, i) => {
    if (typeof tc !== 'object' || tc === null) {
      throw new Error(`testCases[${i}] is not an object.`);
    }
    const t = tc as Record<string, unknown>;
    for (const field of ['id', 'title', 'preconditions', 'expectedResult']) {
      if (typeof t[field] !== 'string') {
        throw new Error(`testCases[${i}].${field} must be a string.`);
      }
    }
    if (!Array.isArray(t.steps) || !t.steps.every((s) => typeof s === 'string')) {
      throw new Error(`testCases[${i}].steps must be an array of strings.`);
    }
    if (typeof t.type !== 'string' || !TEST_TYPES.includes(t.type)) {
      throw new Error(`testCases[${i}].type must be one of ${TEST_TYPES.join(', ')}.`);
    }
    if (typeof t.priority !== 'string' || !PRIORITIES.includes(t.priority)) {
      throw new Error(`testCases[${i}].priority must be one of ${PRIORITIES.join(', ')}.`);
    }
  });

  return {
    storyId,
    observations: obj.observations as string[],
    testCases: obj.testCases as GenerationResult['testCases'],
  };
}
