import { Maybe } from "purify-ts/Maybe";
import { Observable, Subject } from "rxjs";

/**
 * The same as `lastValue` except it returns a Nothing if the observable
 * couldn't provide an immediately resolvable value.
 *
 * @param obs Observable
 * @returns
 */
export function lastValueMaybe<T>(obs: Observable<T>): Maybe<T> {
  let x: T | undefined = undefined;
  // This relies on subscribe resolving its callback immediately in the case
  // that there has been at least one value pushed into the subject
  // previously.
  obs
    .subscribe((v) => {
      x = v;
    })
    .unsubscribe();
  return Maybe.fromNullable<T>(x);
}

/**
 * This function is very much like `firstValueFrom` provided by `rxjs` except
 * that this function always returns immediately (it does not return a promise).
 * As such, it will throw an exception if a value cannot be resolved immediately.
 * This, in turn, means it should always be called on a ReplaySubject.
 *
 * @param obs Observable
 * @param msg Error message to emit on failure
 * @returns Immediately resolved value of type `T`
 */
export function lastValue<T>(obs: Observable<T>, msg?: string): T {
  return lastValueMaybe(obs).caseOf({
    Nothing: () => {
      throw new Error(msg ?? "ExtendedReplaySubject has no last value");
    },
    Just: (v) => {
      return v;
    },
  });
}

export function update<T>(obs: Subject<T>, f: (x: T) => T) {
  obs.next(f(lastValue(obs)));
}
