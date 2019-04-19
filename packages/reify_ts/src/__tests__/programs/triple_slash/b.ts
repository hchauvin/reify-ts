/// <reference path="./a.ts" />

declare namespace B {
  export interface World {
    hello: A.Hello;
  }
}
