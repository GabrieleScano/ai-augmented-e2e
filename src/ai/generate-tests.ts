import { writeFileSync } from 'node:fs';
import { generateTestCases } from './client.js';
import type { UserStory } from './types.js';

/**
 * Example story used to demonstrate the generator.
 * In a real workflow this would be read from a ticket (Jira, etc.).
 */
const exampleStory: UserStory = {
  id: 'AUTH-12',
  story:
    'As a registered user, I want to log in with my username and password so that I can access my account.',
  acceptanceCriteria: [
    'Given valid credentials, when I submit the form, then I am redirected to the inventory page.',
    'Given an empty password, when I submit, then a "Password is required" error is shown.',
    'Given a locked-out account, when I submit valid credentials, then a lockout error is shown.',
  ],
};

async function main(): Promise<void> {
  console.log(`Generating test cases for story ${exampleStory.id}...\n`);
  const result = await generateTestCases(exampleStory);

  console.log('Observations (shift-left findings):');
  for (const obs of result.observations) {
    console.log(`  - ${obs}`);
  }

  console.log(`\nGenerated ${result.testCases.length} test cases:`);
  for (const tc of result.testCases) {
    console.log(`  [${tc.priority.toUpperCase()}] ${tc.id} (${tc.type}): ${tc.title}`);
  }

  const outPath = 'generated-tests.json';
  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\nFull output written to ${outPath}`);
}

main().catch((error: unknown) => {
  console.error('Generation failed:', error);
  process.exitCode = 1;
});
