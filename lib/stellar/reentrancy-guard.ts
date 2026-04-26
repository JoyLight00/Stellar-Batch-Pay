/**
 * Client-side reentrancy guard for Soroban vesting SDK calls (#250).
 *
 * While Soroban transactions are atomic on-chain, concurrent browser-side
 * calls to deposit(), claim(), or revoke() for the same account can submit
 * duplicate transactions before the first one is confirmed.  This module
 * provides a simple in-memory lock keyed by (publicKey, operation) that
 * rejects any call arriving while a prior call for the same key is still
 * in flight.
 *
 * Usage:
 *   const release = acquireGuard(publicKey, 'deposit');
 *   try { await buildDepositTransaction(...); }
 *   finally { release(); }
 */

type GuardKey = string;

const _activeLocks = new Set<GuardKey>();

function makeKey(publicKey: string, operation: 'deposit' | 'claim' | 'revoke'): GuardKey {
  return `${publicKey}:${operation}`;
}

/**
 * Attempt to acquire an exclusive lock for the given account + operation.
 *
 * @returns A release function that MUST be called in a `finally` block.
 * @throws {ReentrancyError} if the lock is already held.
 */
export function acquireGuard(
  publicKey: string,
  operation: 'deposit' | 'claim' | 'revoke',
): () => void {
  const key = makeKey(publicKey, operation);

  if (_activeLocks.has(key)) {
    throw new ReentrancyError(
      `A ${operation} call for ${publicKey} is already in progress. ` +
        'Wait for it to complete before submitting another.',
      operation,
    );
  }

  _activeLocks.add(key);

  return function release() {
    _activeLocks.delete(key);
  };
}

/**
 * Returns true if the given account + operation currently holds the lock.
 * Useful for disabling UI controls while a call is in flight.
 */
export function isLocked(
  publicKey: string,
  operation: 'deposit' | 'claim' | 'revoke',
): boolean {
  return _activeLocks.has(makeKey(publicKey, operation));
}

export class ReentrancyError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
  ) {
    super(message);
    this.name = 'ReentrancyError';
  }
}
