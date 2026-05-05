export const LIMITS_ENABLED = process.env.LIMITS === 'true';

export class LimitError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'LimitError';
  }
}