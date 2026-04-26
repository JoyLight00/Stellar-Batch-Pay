/**
 * GitHub Actions secret backend (#257).
 *
 * In GitHub Actions, secrets are injected directly as environment variables.
 * This backend reads from process.env like the env-backend but does NOT print
 * the local-dev warning — secrets injected by GitHub Actions are safe.
 *
 * Setup: add secrets to your repo at
 *   Settings → Secrets and variables → Actions
 * Then reference them in your workflow:
 *   env:
 *     KEEPER_SECRET: ${{ secrets.KEEPER_SECRET }}
 *     SECRET_BACKEND: github
 */

import type { SecretsProvider } from './index';

export class GitHubSecretsProvider implements SecretsProvider {
  async fetchSecret(name: string): Promise<string> {
    const value = process.env[name];
    if (!value) {
      throw new Error(
        `[github-backend] Secret "${name}" is not available as a GitHub Actions secret. ` +
          `Ensure it is added to the repository secrets and exposed in the workflow env block.`,
      );
    }
    return value;
  }
}
