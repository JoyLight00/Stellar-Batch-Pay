/**
 * .env / process.env fallback backend (#257).
 * For local development only — never use in production.
 */

import type { SecretsProvider } from './index';

export class EnvSecretsProvider implements SecretsProvider {
  async fetchSecret(name: string): Promise<string> {
    const value = process.env[name];
    if (!value) {
      throw new Error(
        `[env-backend] Required secret "${name}" is not set in environment variables.`,
      );
    }
    return value;
  }
}
