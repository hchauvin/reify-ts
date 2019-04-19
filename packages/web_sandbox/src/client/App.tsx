import * as React from 'react';
import { Demo } from './Demo';
import { Row, Col, Card, Button } from 'antd';

export function App() {
  return (
    <div className="app">
      <TitleSection />
      <UspsSection />
      <DemoSection />
      <UseCasesSection />
      <CopyrightSection />
    </div>
  );
}

function TitleSection() {
  return (
    <section className="title">
      <h1>
        reify-ts
        <a
          href="https://github.com/hchauvin/reify-ts"
          target="_blank"
          id="github"
          title="View on  GitHub"
        >
          <img src="github_reverse.svg" />
        </a>
      </h1>
      <h2>Runtime type reflection for TypeScript</h2>
      <h4>
        reify-ts plugs into the TypeScript compiler and generates type
        reflection on the flight. Type reflection can be used to validate API
        payloads and to generate random values for{' '}
        <a href="https://en.wikipedia.org/wiki/QuickCheck" target="_blank">
          hypothesis testing / quick checking
        </a>
        .
      </h4>
    </section>
  );
}

function UspsSection() {
  return (
    <section className="usps">
      <Row gutter={24}>
        <Col span={8}>
          <h3>TypeScript-native</h3>
          <p>
            Validate your payloads using TypeScript types. No need for{' '}
            <a href="https://json-schema.org/" target="_blank">
              JSON schemas
            </a>{' '}
            or{' '}
            <a
              href="https://en.wikipedia.org/wiki/Domain-specific_language"
              target="_blank"
            >
              Domain-Specific Languages
            </a>{' '}
            such as{' '}
            <a
              href="https://developers.google.com/protocol-buffers/"
              target="_blank"
            >
              Protocol Buffers
            </a>{' '}
            or{' '}
            <a href="https://thrift.apache.org/" target="_blank">
              Apache Thrift
            </a>{' '}
            that come with their own type systems.
          </p>
        </Col>
        <Col span={8}>
          <h3>A modular architecture</h3>
          <p>
            reify-ts plugs into a{' '}
            <a href="https://github.com/cevek/ttypescript" target="_blank">
              modified version of the TypeScript compiler
            </a>{' '}
            that uses the TypeScript transformer API. reify-ts <i>visitors</i>{' '}
            indicate the reify-ts <i>engine</i> where the types are to be found,
            and reify-ts <i>consumers</i> access these types at runtime.
          </p>
        </Col>
        <Col span={8}>
          <h3>Based on proven technologies</h3>
          <p>
            The reify-ts consumers are based on{' '}
            <a href="https://github.com/gcanti/io-ts" target="_blank">
              io-ts
            </a>{' '}
            for validation, and on{' '}
            <a href="https://github.com/dubzzz/fast-check" target="_blank">
              fast-check
            </a>{' '}
            for hypothesis testing / quick checking.
          </p>
        </Col>
      </Row>
    </section>
  );
}

function DemoSection() {
  return (
    <section className="demo">
      <h2>Demo</h2>
      <Demo />
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="use-cases">
      <h2>Use cases</h2>
      <Row gutter={24}>
        <Col span={6}>
          <Card
            title={
              <div>
                Safe <code>JSON.parse</code>
              </div>
            }
            actions={[
              <Button
                href="https://github.com/hchauvin/reify-ts/tree/master/packages/example_safe_json_parse"
                target="_blank"
              >
                <img src="github.svg" />
                <span>View on GitHub</span>
              </Button>,
            ]}
          >
            Use reify-ts to safely parse all kinds of JSON payloads:
            configuration files, API payloads, JSON fields in a DB, &hellip;
            Validate as you would with JSON schemas without ever leaving
            TypeScript.
          </Card>
        </Col>
        <Col span={6}>
          <Card
            title="API QuickCheck"
            actions={[
              <Button
                href="https://github.com/hchauvin/reify-ts/tree/master/packages/example_fast_check"
                target="_blank"
              >
                <img src="github.svg" />
                <span>View on GitHub</span>
              </Button>,
            ]}
          >
            Use reify-ts to generate sample values for a given type, test a
            function over its whole definition domain, and go beyond
            &ldquo;foo-bar&rdquo; tests.
          </Card>
        </Col>
        <Col span={6}>
          <Card
            title="Frontend use"
            actions={[
              <Button
                href="https://github.com/hchauvin/reify-ts/tree/master/packages/example_webpack"
                target="_blank"
              >
                <img src="github.svg" />
                <span>View on GitHub</span>
              </Button>,
            ]}
          >
            reify-ts can be used in the browser.
          </Card>
        </Col>
        <Col span={6}>
          <Card
            title={<div>rpc_ts validating codec</div>}
            actions={[
              <Button
                href="https://github.com/hchauvin/reify-ts/tree/master/packages/example_rpc_ts"
                target="_blank"
              >
                <img src="github.svg" />
                <span>View on GitHub</span>
              </Button>,
            ]}
          >
            Use reify-ts with rpc_ts to validate the requests and responses of
            your RPC services.
          </Card>
        </Col>
      </Row>
    </section>
  );
}

function CopyrightSection() {
  return (
    <section className="copyright">
      MIT License — Copyright (c) 2019 Hadrien Chauvin
    </section>
  );
}
