/**
 * Secret management factory for the Keeper bot (#257).
 *
 * Selects the backend at runtime via SECRET_BACKEND env var:
 *   SECRET_BACKEND=aws    → AWS Secrets Manager
 *   SECRET_BACKEND=github → GitHub Actions secret (env-injected at runtime)
 *   SECRET_BACKEND=env    → .env file (local dev only — prints a warning)
 *
 * All backends expose the same interface: fetchSecret(name) → string
 */

export type SecretBackend = 'aws' | 'github' | 'env';

export interface SecretsProvider {
  fetchSecret(name: string): Promise<string>;
}

export async function createSecretsProvider(): Promise<SecretsProvider> {
  const backend = (process.env.SECRET_BACKEND ?? 'env') as SecretBackend;

  switch (backend) {
    case 'aws': {
      const { AwsSecretsProvider } = await import('./aws-backend');
      return new AwsSecretsProvider();
    }
    case 'github': {
      const { GitHubSecretsProvider } = await import('./github-backend');
      return new GitHubSecretsProvider();
    }
    case 'env':
    default: {
      console.warn(
        '[secrets] SECRET_BACKEND=env — reading secrets from environment variables. ' +
          'This is only safe for local development. Set SECRET_BACKEND=aws or github in production.',
      );
      const { EnvSecretsProvider } = await import('./env-backend');
      return new EnvSecretsProvider();
    }
  }
}
