export type CreateResult<T> = [Reason, null] | [null, T];

type Reason = {
  reason: string;
};
