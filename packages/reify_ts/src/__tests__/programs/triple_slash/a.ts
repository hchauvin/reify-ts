/// <reference path="./b.ts" />

declare namespace A {
  export interface Hello {
    world: B.World;
  }
}
