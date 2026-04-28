/**
 * Validation utilities for UI state and transaction safety.
 */

import { PaymentInstruction } from '@/lib/stellar/types';
import { AssetAmount } from './aggregateAssets';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that a batch can be submitted given balances and trustlines.
 * This is used before enabling the submit button.
 */
export function validateBatchSubmission(
  payments: PaymentInstruction[],
  balances: AssetAmount[],
  missingTrustlines: string[], // addresses missing trustlines for the asset
  selectedNetwork: 'testnet' | 'mainnet',
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (payments.length === 0) {
    errors.push('No payments to submit.');
    return { valid: false, errors, warnings };
  }

  // Check network mismatch? (handled elsewhere)

  // Balance check: aggregate required amounts per asset
  const requiredByAsset = new Map<string, bigint>();
  const toStroops = (amount: string): bigint => {
    const parts = amount.split('.');
    const integer = parts[0];
    const fraction = parts[1] || '';
    const padded = fraction.padEnd(7, '0').slice(0, 7);
    return BigInt(integer) * 10_000_000n + BigInt(padded);
  };

  for (const payment of payments) {
    const asset = payment.asset;
    const amount = toStroops(payment.amount);
    requiredByAsset.set(asset, (requiredByAsset.get(asset) || 0n) + amount);
  }

  // Compare with available balances
  const balanceMap = new Map<string, bigint>();
  for (const bal of balances) {
    balanceMap.set(bal.asset, toStroops(bal.total));
  }

  for (const [asset, required] of requiredByAsset.entries()) {
    const available = balanceMap.get(asset) || 0n;
    if (required > available) {
      errors.push(`Insufficient balance for ${asset}. Required: ${required.toString()}, Available: ${available.toString()}`);
    }
  }

  // Trustline warnings
  if (missingTrustlines.length > 0) {
    warnings.push(`${missingTrustlines.length} recipient(s) missing trustline. You can skip or convert to claimable balance.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate that a transaction will not exceed network limits.
 */
export function validateTransactionSize(payments: PaymentInstruction[], maxOperations: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (payments.length > maxOperations) {
    errors.push(`Batch size (${payments.length}) exceeds maximum operations per transaction (${maxOperations}).`);
  }

  // TODO: add size estimation using batcher functions

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Sanitize and normalize payment instruction for submission.
 */
export function normalizePayment(instruction: PaymentInstruction): PaymentInstruction {
  return {
    address: instruction.address.trim(),
    amount: instruction.amount.trim(),
    asset: instruction.asset.trim(),
    memo: instruction.memo?.trim(),
    memoType: instruction.memoType,
  };
}
