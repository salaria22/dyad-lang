export interface FollowOptions {
  /** Indicates if we want to see duplicates */
  duplicates?: boolean;
}

export interface ModifyOptions {
  /**
   * Indicates whether to immediately push out a new raw tree after
   * modification.  This will potentially result in two passes of semantic
   * processing (once when the modification is made and once when the unparsed
   * Dyad code is re-parsed).
   **/
  immediate?: boolean;
}
