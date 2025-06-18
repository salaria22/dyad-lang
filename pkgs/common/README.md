# `remodel-common`

## Installation

This package can be installed with `npm install @juliacomputing/dyad-common`.

To build the package, you can run:

```sh
$ npm install && npm run clean && npm run build && npm run test
```

This library is composed of the following functionality

## Exhaustion Assertion

The `assertUnreachable` function takes an argument of type `never`. This means
you can use it in the `default` clause of a `switch` state and it will detect
whether you have forgotten any `case` statements. If the `assertUnreachable`
call triggers a type error it is because your `case` statements are not
exhaustive. This is very useful in statically identifying any bugs that get
introduced when you expect the set of possible cases.

## Record Filtering

This package contains the two functions `filterEntries` and `filterRecord`. See
[`entries.ts`](src/entries.ts) to learn more about what these functions do and
[`entries.test.ts`](src/entries.test.ts) to see examples of their usage.

## RFC Inspired `Problem` Type

While [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807) was designed for
use with HTTP APIs, the same principles can be used in general when reporting
software issues in other contexts. What I like about the `Problem` approach is
that it clearly delineates two different properties of "problem reports" and
then divides each again into a machine readable and human readable version. Let
me explain by way of an example:

### Missing File

Generally in the Javascript world when you want to throw an error. In the case
of a missing file you might do something like this:

```javascript
throw new Error(`Unable to locate file ${file}`);
```

This explains the error but it doesn't give you much information about the
_class_ of error. You might instead do this to make it a bit more explicit:

```javascript
throw new Error(`Missing file: unable to locate file ${file}`);
```

Adding some kind of prefix to the error like this could help in case people want
to Google the error message. They can't google the specifics because the file
name might not be the same. But they could Google "Missing file: unable to
locate file". If you pay attention, you'll see that they TypeScript compiler
does something like this, _e.g.,_

```
error TS2322: Type 'number' is not assignable to type 'string'.
```

Note the `TS2322`. That appears in any message where you cannot assign a value
of one type to another and it makes it very easy to Google.

### RFC 7807

What does any of this have to do with this package? Well, RFC 7807 _explicitly_
requires all error messages to include information about the _class_ of problem
that is being reported as well as the specific _details_ of the specific problem
being reported. **Furthermore**, it requires that this information be presented
both in a machine readable format _and_ a human readable format. So let's
revisit our missing file example. Represented as a `Problem`, this would look
something like this:

```json
{
  "severity": "error",
  "type": "EC212",
  "title": "Missing File",
  "instance": "urn:ec212:input.csv",
  "details": "unable to locate file input.csv"
}
```

...where the fields are:

- `severity`: indicates the severity of the problem. Value values are
  `"error"`, `"warning"` and `"info"`
- `type`: a _machine readable_ identifier for the _class_ of problem
- `title`: a _human readable_ description for the _class_ of problem
- `instance`: a _machine readable_ identifier that is specific to this
  particular instance of the problem
- `details`: a _human readable_ description that is specific to this particular
  instance of the problem

In addition, the `Problem` type can include an optional piece of data in the
`"extra"` field that provides machine readable specifics, _e.g._

```json
{
  "severity": "error",
  "type": "EC212",
  "title": "Missing File",
  "instance": "urn:ec212:input.csv",
  "details": "unable to locate file input.csv",
  "extra": {
    "file": "input.csv",
    "dir": "/var"
  }
}
```

This allows some additional, potentially, relevant details to be included like
what file was being looked for and/or what directory the file was expected to be
found in. The former could potentially be extracted by parsing the `"details"`
field (which would be tedious and error prone to do) but the latter is
additional information that, in included in `"details"`, might make for a very
long error message so it is instead simply stored in the `"extra"` field. The
`Problem` `interface` has a type parameter to describe this extra information
should you want the type safety. For the example above this would be:

```typescript
Problem<{ file: string; dir: string }>;
```

...where the default type for the `"extra`" field is `void` (so you don't need
to specify the type parameter unless there actually _is_ an `"extra"` field
present).

### Problems as Errors

Instead of throwing a simple instance of `Error`, it is possible to generate
errors that include all the information of a `Problem`. This can be done by
using the `createError` function to create an "error factory" that produces
instances of `Error` that are specializations of `Error` with all the details
associated with a `Problem`. Here is an example:

```typescript
const MissingFileError = createError("EC212", "Missing File");
try {
  // ... some code which might throw an error
} catch (e) {
  if (e instanceof MissingFileError) {
    // Handle this specific class of errors
  }
}
```

The instance of `e` above would have the `"severity"`, `"type"`, `"title"`,
`"instance"` and `"details"` of a `Problem` along with the normal `"message"`
field of an error (which would match the `"details"` field). Such an error
could be thrown by just specifying the details of the particular problem being
reported, _e.g.,_

```typescript
throw new MissingFileError(
  `urn:ec212:${file}`,
  "unable to locate file input.csv"
);
```

This makes it both very easy to create instances of problems (since you can
avoid repeating all the problem _class_ related information) and easy to catch
and identify particular types of problems by leveraging `instanceof`.
