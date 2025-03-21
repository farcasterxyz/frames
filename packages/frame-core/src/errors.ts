export class BaseError<
  cause extends Error | undefined = undefined,
> extends Error {
  override name = 'BaseError'
  cause: cause

  constructor(message: string, options: BaseError.Options<cause> = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.cause = options.cause as any
  }
}

export declare namespace BaseError {
  type Options<cause extends Error | undefined = Error | undefined> = {
    cause?: cause | undefined
  }
}

export type GlobalErrorType<name extends string = 'Error'> = Error & {
  name: name
}
