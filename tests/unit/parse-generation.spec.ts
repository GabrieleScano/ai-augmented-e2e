import { test, expect } from '@playwright/test';
import { parseGenerationResult } from '../../src/ai/client.js';

/**
 * Unit tests for the AI response parser. No network: we feed raw model
 * text directly, asserting we accept well-formed output and reject
 * anything malformed instead of trusting the model blindly.
 */

const validPayload = JSON.stringify({
  observations: ['The "locked-out" precondition is not defined.'],
  testCases: [
    {
      id: 'TC-1',
      title: 'Valid login redirects to inventory',
      type: 'positive',
      priority: 'high',
      preconditions: 'A registered standard user',
      steps: ['Open login', 'Enter valid credentials', 'Submit'],
      expectedResult: 'User lands on the inventory page',
    },
  ],
});

test('parses a well-formed response', () => {
  const result = parseGenerationResult(validPayload, 'AUTH-12');
  expect(result.storyId).toBe('AUTH-12');
  expect(result.observations).toHaveLength(1);
  expect(result.testCases[0]?.id).toBe('TC-1');
});

test('strips markdown code fences before parsing', () => {
  const fenced = '```json\n' + validPayload + '\n```';
  const result = parseGenerationResult(fenced, 'AUTH-12');
  expect(result.testCases).toHaveLength(1);
});

test('throws on invalid JSON', () => {
  expect(() => parseGenerationResult('not json', 'X')).toThrow(/not valid JSON/);
});

test('throws when observations is not an array of strings', () => {
  const bad = JSON.stringify({ observations: 'nope', testCases: [] });
  expect(() => parseGenerationResult(bad, 'X')).toThrow(/observations/);
});

test('throws on an invalid test-case type enum', () => {
  const bad = JSON.stringify({
    observations: [],
    testCases: [
      {
        id: 'TC-1',
        title: 't',
        type: 'smoke', // not a valid TestType
        priority: 'high',
        preconditions: 'p',
        steps: ['s'],
        expectedResult: 'r',
      },
    ],
  });
  expect(() => parseGenerationResult(bad, 'X')).toThrow(/type must be one of/);
});

test('throws when a test case is missing a required field', () => {
  const bad = JSON.stringify({
    observations: [],
    testCases: [{ id: 'TC-1', type: 'positive', priority: 'low', steps: [], expectedResult: 'r' }],
  });
  expect(() => parseGenerationResult(bad, 'X')).toThrow(/title must be a string/);
});
