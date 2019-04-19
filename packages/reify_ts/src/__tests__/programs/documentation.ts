/** Documentation */
export type TypeAlias = number;

/** Documentation */
export type RecordTypeAlias = {
  /** Documentation: a */
  a: string;
};

/** Documentation */
export interface Interface {
  /** Documentation: a */
  a: string;
}

/**
 * Documentation
 *
 * @foo bar
 */
export interface WithTags {
  /**
   * Documentation: a
   *
   * @qux bar
   */
  a: string;
}
