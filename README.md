# reify-ts: Runtime type reflection for TypeScript

[![CircleCI](https://circleci.com/gh/hchauvin/reify-ts/tree/master.svg?style=svg)](https://circleci.com/gh/hchauvin/reify-ts/tree/master) [![Coverage Status](https://coveralls.io/repos/github/hchauvin/reify-ts/badge.svg?branch=master)](https://coveralls.io/github/hchauvin/reify-ts?branch=master) [![npm version](https://badge.fury.io/js/reify-ts.svg)](https://badge.fury.io/js/reify-ts) [![typescript](./docs/typescript.svg)](https://aleen42.github.io/badges/src/typescript.svg) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

reify-ts plugs into the TypeScript compiler and generates type reflection on the flight. Type reflection can be used to validate API payloads and to generate random values for [hypothesis testing / quick checking](https://en.wikipedia.org/wiki/QuickCheck).

You can try reify-ts in the browser [here](https://hchauvin.github.io/reify-ts/).

## Why?

TypeScript type system is awesome. However, due to complete type erasure at runtime, I/O boundaries, where values enter or leave the type-checked compilation unit (API calls, browser-server communication, configuration files, JSON in the DB, &hellip;), are not secure. Validation is then carried on using either manual deserialization code, JSON schemas, or other Domain-Specific Languages such as Protocol Buffers or Apache Thrift. This comes with friction, as now types are defined in multiple type systems. For most web applications, this is clearly overkill.

However, the TypeScript team has been very clear that type erasure and minimal runtime impact is a core tenet of TypeScript, so comprehensive type reflection will probably never be part of the TypeScript compiler itself (nor do I think it should be). I developed `reify-ts` to meet these needs and to properly address I/O boundaries. Not only are they a security issue, they are also an important source of bugs, and I feel that not securing them slows down development.

## Compatibility

reify-ts has been extensively checked against **TypeScript 3.4.1, 3.5.1, and 3.6.4.**

## License

reify-ts is licensed under the MIT License.
