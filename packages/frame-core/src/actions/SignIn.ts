import * as Errors from "../errors";
import type { OneOf } from "../internal/types";

export type SignInOptions = {
  /**
   * A random string used to prevent replay attacks.
   */
  nonce: string;

  /**
   * Start time at which the signature becomes valid.
   * ISO 8601 datetime.
   */
  notBefore?: string;

  /**
   * Expiration time at which the signature is no longer valid.
   * ISO 8601 datetime.
   */
  expirationTime?: string;

  /**
   * A custom domain or audience for the sign-in request.
   */
  domain?: string;

  /**
   * Additional metadata to include in the sign-in message.
   */
  metadata?: Record<string, string>;
};

export type SignInResult = {
  signature: string;
  message: string;

  /**
   * Public address of the signer.
   */
  address: string;
};

export type SignIn = (options: SignInOptions) => Promise<SignInResult>;

type RejectedByUserJsonError = {
  type: "rejected_by_user";
};

type InvalidOptionsJsonError = {
  type: "invalid_options";
  message: string;
};

export type SignInJsonError = RejectedByUserJsonError | InvalidOptionsJsonError;

export type SignInJsonResult = OneOf<
  { result: SignInResult } | { error: SignInJsonError }
>;

export type WireSignIn = (options: SignInOptions) => Promise<SignInJsonResult>;

/**
 * Thrown when a sign in action was rejected.
 */
export class RejectedByUser extends Errors.BaseError {
  override readonly name = "SignIn.RejectedByUser";

  constructor() {
    super("Sign in rejected by user");
  }
}

/**
 * Thrown when the provided sign-in options are invalid.
 */
export class InvalidOptionsError extends Errors.BaseError {
  override readonly name = "SignIn.InvalidOptionsError";

  constructor(message: string) {
    super(`Invalid sign-in options: ${message}`);
  }
}
