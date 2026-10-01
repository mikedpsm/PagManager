import { describe, expect, it } from 'vitest';

import { MAX_USERNAME_LENGTH } from '../src/field-limits.js';
import { updateMeInputSchema, userSchema } from '../src/user.js';

describe('UpdateMeInput security fields', () => {
  it('allows ordinary profile updates without password fields', () => {
    expect(
      updateMeInputSchema.safeParse({ username: 'Updated User' }).success,
    ).toBe(true);
  });

  it('requires the current password and confirmation when setting a new password', () => {
    expect(
      updateMeInputSchema.safeParse({
        passwd: 'replacement-password',
        confirmPasswd: 'replacement-password',
      }).success,
    ).toBe(false);

    expect(
      updateMeInputSchema.safeParse({
        passwd: 'replacement-password',
        confirmPasswd: 'replacement-password',
        currentPasswd: 'old-password',
      }).success,
    ).toBe(true);
  });

  it('does not accept a current password without a new password', () => {
    expect(
      updateMeInputSchema.safeParse({ currentPasswd: 'old-password' }).success,
    ).toBe(false);
  });

  it('limits updated usernames while preserving legacy response values', () => {
    expect(
      updateMeInputSchema.safeParse({
        username: 'u'.repeat(MAX_USERNAME_LENGTH),
      }).success,
    ).toBe(true);
    expect(
      updateMeInputSchema.safeParse({
        username: 'u'.repeat(MAX_USERNAME_LENGTH + 1),
      }).success,
    ).toBe(false);

    expect(
      userSchema.safeParse({
        id: '6f61ad58-06fc-47fd-8c9a-4533e9206d16',
        username: 'legacy '.repeat(MAX_USERNAME_LENGTH),
        email: 'legacy@example.com',
      }).success,
    ).toBe(true);
  });
});
