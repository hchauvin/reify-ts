/**
 * Documentation
 *
 * @foo bar
 */
export enum Enum {
  a = 'a',
}

/**
 * Documentation
 *
 * @foo bar
 */
export interface Interface {
  a: NonExportedDependency;
}

/**
 * Documentation
 *
 * @foo bar
 */
export type TypeAlias = string;

/**
 * Documentation
 *
 * @foo bar
 */
interface NonExportedDependency {
  a: number;
}

/**
 * Documentation
 *
 * @foo bar
 */
interface NonExported {
  a: boolean;
}

// This is just so that NonExported does not trigger a "unused symbol" error.
<NonExported>{};

const ExportedThroughNamedExport = 10;

export { ExportedThroughNamedExport };

/**
 * Documentation
 *
 * @foo bar
 */
const moduleDefault = 10;

export default moduleDefault;

export namespace Module {
  export namespace SubModule {
    /**
     * Documentation
     *
     * @foo bar
     */
    export interface Interface {
      a: number;
    }

    /**
     * Documentation
     *
     * @foo bar
     */
    export type TypeAlias = { a: number };
  }
}

export type ModuleTypeReference = {
  a: Module.SubModule.Interface;
  b: Module.SubModule.TypeAlias;
};
