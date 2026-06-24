/**
 * Shared types for the AI-augmented test design module.
 */

export interface UserStory {
  /** Stable identifier, e.g. "AUTH-12". */
  readonly id: string;
  /** "As a..., I want..., so that..." statement. */
  readonly story: string;
  /** Acceptance criteria, ideally in Given/When/Then form. */
  readonly acceptanceCriteria: readonly string[];
}

export type TestType = 'positive' | 'negative' | 'edge' | 'boundary';
export type Priority = 'high' | 'medium' | 'low';

export interface GeneratedTestCase {
  readonly id: string;
  readonly title: string;
  readonly type: TestType;
  readonly priority: Priority;
  readonly preconditions: string;
  readonly steps: readonly string[];
  readonly expectedResult: string;
}

export interface GenerationResult {
  readonly storyId: string;
  /** Ambiguities or gaps detected in the requirements (shift-left). */
  readonly observations: readonly string[];
  readonly testCases: readonly GeneratedTestCase[];
}
