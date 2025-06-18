// This is a class of error that **should not happen**.  If it is thrown it
// indicates that some aspect of the AST or derived data is missing information
// **that should be there**.  If an instance of this is thrown, it means that

import { ASTNode, ProblemSpan } from "@juliacomputing/dyad-ast";
import {
  createError,
  createExtraError,
  Problem,
  problemError,
} from "@juliacomputing/dyad-common";

export const compilerAssertionType = "CompilerAssertionError" as const;
/**
 * This error type indicates that some fundamental assumption in the compiler
 * implementation has been violated.  This indicates some upstream bug in
 * formulate the data being processed.
 */
export const CompilerAssertionError = createExtraError<ProblemSpan | void>(
  compilerAssertionType,
  "Compiler assertion error (this should not happen)"
);

export const unimplementedType = "unimplemented";
/**
 * This error type is used to indicate that the compiler _should_ be able to
 * handle something but support for that particular contingency has not _yet_
 * been implemented.
 */
export const UnimplementedError = createError(
  unimplementedType,
  "Unimplemented"
);

/**
 * This error is thrown when we attempt to fetch something but are unable
 * to do so.
 */
export const MissingResource = createError(
  "MissingResource",
  "Missing Resource"
);

/**
 * This error is thrown if we are attempting to manipulate an AST Node but are
 * unable to find its provider (so that we can write the updated Dyad source
 * back to the `LibraryProvider`).  This would only occur if someone attempted
 * to use a `modify` method on a node that was not derived from Dyad source
 * code (e.g., the `WorkspaceNode`)
 */
export const NoProvider = createError(
  "NoProvider",
  "No Library Provider Found"
);

/**
 * This error is thrown if we are attempting to manipulate an AST Node
 * but are unable to find the file where the source was located.  This would
 * only occur if someone attempted to use a `modify` method on a node
 * that was not derived from Dyad source code (e.g., the `WorkspaceNode`)
 */
export const NoFile = createError("NoFile", "No File Found");

/**
 * This error is thrown if we request the "path" (an inherited attribute
 * computed during semantic processing) of an AST Node but find that it
 * doesn't have one.  This should not happen.
 */
export const MissingPath = createError("MissingPath", "Missing Path");

/**
 * This error is thrown when an AST Node is modified using the `modify*` methods
 * and an error occurs while trying to unparse the AST or trying to write
 * the file back to the library provider.
 */
export const WriteBackFailure = createError(
  "WriteBackFailure",
  "Write Back Failure"
);

/**
 * This error is thrown if an attempt is made to mutate a node, but that
 * mutation fails.  This means, specifically, that the code performing the
 * mutation throws an error.  If the resulting mutation includes an invalidate
 * AST or there is an I/O error writing the Dyad source back to the
 * LibraryProvider, that would be a `WriteBackFailure` error.
 */
export const MutationFailure = createError(
  "MutationFailure",
  "Mutation Failure"
);

export const infiniteRecursionType = "infinite-type-recursion" as const;
/**
 * This occurs if we end up chasing our tail trying to resolve a type
 * (_e.g.,_ `type Foo = Foo()`)
 */
export const InfiniteTypeRecursion = createExtraError<ProblemSpan>(
  infiniteRecursionType,
  "Infinite Type Recursion"
);

export function isInfiniteRecursion(p: Problem): boolean {
  return p.type === infiniteRecursionType;
}

/**
 * This occurs if a type cannot be resolved.
 */
export const TypeNotFound = createExtraError<ProblemSpan>(
  "type-not-found",
  "Type not found"
);

/**
 * This occurs if there are two types with the same name in a given scope.
 */
export const DuplicateType = createExtraError<ProblemSpan>(
  "duplicate-type",
  "Duplicate type"
);

/**
 * Occurs if a scalar type extends from a non-scalar type.
 */
export const NonScalarTypeError = createExtraError<ProblemSpan>(
  "NonScalarTypeError",
  "Non-scalar type"
);

export const OrphanedNode = createExtraError<ASTNode>(
  "OrphanedNode",
  "Orphaned node"
);

export const ClosedTransaction = createError(
  "ClosedTransaction",
  "Closed transaction"
);

export const invalidPath = problemError(
  "invalid-resource-path",
  "Invalid resource path"
);
