// scripts/keeper.ts
import {
  SorobanRpc,
  Networks,
  Keypair,
  TransactionBuilder,
  Account,
  Contract,
  Address,
  nativeToScVal
} from 'stellar-sdk';
import { createSecretsProvider } from '../lib/secrets/index';

/**
 * CONFIGURATION
 */
const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || Networks.TESTNET;
const CONTRACT_ID = process.env.CONTRACT_ID;
const U32_MAX = 2 ** 32 - 1;
const MAINTENANCE_START_INDEX = readU32Env('MAINTENANCE_START_INDEX', 0);
const MAINTENANCE_LIMIT = readU32Env('MAINTENANCE_LIMIT', 10);
const BUMP_THRESHOLD_DAYS = 7;

if (!CONTRACT_ID) {
  console.error('MISSING CONTRACT_ID in environment');
  process.exit(1);
}

function readU32Env(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0 || value > U32_MAX) {
    throw new Error(`${name} must be an unsigned 32-bit integer`);
  }

  return value;
}

async function main() {
  // Fetch the keeper secret from the configured backend (#257).
  // Set SECRET_BACKEND=aws|github|env (default: env with a warning).
  const secrets = await createSecretsProvider();
  const keeperSecret = await secrets.fetchSecret('KEEPER_SECRET');
  const keeperKeypair = Keypair.fromSecret(keeperSecret);
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID!);

  console.log('Starting Keeper Bot...');
  console.log(`Contract: ${CONTRACT_ID}`);
  console.log(`Keeper: ${keeperKeypair.publicKey()}`);

  try {
    // 1. Fetch active recipients from events (simplified: assume we have a list or indexer)
    // In a production scenario, you would use an indexer or query events.
    // For this demonstration, we'll focus on the logic for a single recipient.
    const recipients = await fetchActiveRecipients();

    for (const recipient of recipients) {
      await maintainRecipient(
        recipient,
        server,
        contract,
        keeperKeypair,
        MAINTENANCE_START_INDEX,
        MAINTENANCE_LIMIT,
      );
    }

    // 2. Maintain contract instance
    await maintainInstance(server, contract, keeperKeypair);

  } catch (error) {
    console.error('Keeper execution failed:', error);
  }
}

async function fetchActiveRecipients(): Promise<string[]> {
  // TODO: Replace with real event scanning or database query
  // For now, return an empty list or a test address
  return [];
}

async function maintainInstance(
  server: SorobanRpc.Server,
  contract: Contract,
  keeperKeypair: Keypair,
) {
  console.log('Checking contract instance TTL...');
  const sourceAccount = await server.getAccount(keeperKeypair.publicKey());

  const tx = new TransactionBuilder(
    new Account(sourceAccount.accountId(), sourceAccount.sequenceNumber()),
    { fee: '100000', networkPassphrase: NETWORK_PASSPHRASE },
  )
    .addOperation(contract.call('bump_instance_ttl'))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    console.log('Instance TTL bump not needed or failed simulation.');
    return;
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, sim).build();
  preparedTx.sign(keeperKeypair);

  const result = await server.sendTransaction(preparedTx);
  console.log(`Instance TTL bumped: ${result.hash}`);
}

async function maintainRecipient(
  recipient: string,
  server: SorobanRpc.Server,
  contract: Contract,
  keeperKeypair: Keypair,
  startIndex: number,
  limit: number,
) {
  console.log(`Checking TTL for recipient: ${recipient} (${startIndex}..${startIndex + limit})`);

  const sourceAccount = await server.getAccount(keeperKeypair.publicKey());

  const tx = new TransactionBuilder(
    new Account(sourceAccount.accountId(), sourceAccount.sequenceNumber()),
    { fee: '100000', networkPassphrase: NETWORK_PASSPHRASE },
  )
    .addOperation(contract.call(
      'maintenance',
      new Address(recipient).toScVal(),
      nativeToScVal(startIndex, { type: 'u32' }),
      nativeToScVal(limit, { type: 'u32' }),
    ))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    console.log(`Maintenance for ${recipient} not needed or failed.`);
    return;
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, sim).build();
  preparedTx.sign(keeperKeypair);

  const result = await server.sendTransaction(preparedTx);
  console.log(`Maintenance completed for ${recipient} (${startIndex}..${startIndex + limit}): ${result.hash}`);
}

main();
