/**
 * Centralized test data and credentials.
 *
 * SauceDemo exposes a fixed set of accounts and a shared password.
 * Keeping them here avoids hardcoding values across specs.
 */

export interface User {
  readonly username: string;
  readonly password: string;
  readonly description: string;
}

export const PASSWORD = 'secret_sauce';

export const users = {
  standard: {
    username: 'standard_user',
    password: PASSWORD,
    description: 'Default user with full, expected behaviour',
  },
  lockedOut: {
    username: 'locked_out_user',
    password: PASSWORD,
    description: 'User that is blocked at login',
  },
  problem: {
    username: 'problem_user',
    password: PASSWORD,
    description: 'User that surfaces UI defects',
  },
} as const satisfies Record<string, User>;

export interface Product {
  readonly name: string;
  readonly price: string;
}

export const products = {
  backpack: { name: 'Sauce Labs Backpack', price: '$29.99' },
  bikeLight: { name: 'Sauce Labs Bike Light', price: '$9.99' },
} as const satisfies Record<string, Product>;
