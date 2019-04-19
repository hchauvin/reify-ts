/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as CodeMirror from 'react-codemirror2';
import { Row, Col, Card, Select, Checkbox } from 'antd';
import { transformCode, VisitorClassName, VisitorMap } from './transform_code';
import { getSampleValues, validateValue } from './visitors';
import { exampleCode } from '../../src/client/example_code';
import { useDebounce } from './use_debounce';
import { TypeEntry } from 'reify-ts/lib/types';

export function Demo() {
  const [typeScript, onTypeScriptChange] = React.useState('');
  const [visitorMap, onChangeVisitorMap] = React.useState({
    [VisitorClassName.allTypes]: {},
    [VisitorClassName.placeholderCalls]: {},
  } as VisitorMap);
  const [debouncedTypeScript, setDebouncedTypeScript] = useDebounce(
    typeScript,
    500,
  );
  const { ast, generatedCode, console } = React.useMemo(
    () => transformCode(debouncedTypeScript, visitorMap),
    [debouncedTypeScript, visitorMap],
  );
  return (
    <div className="type-script-panels">
      <Configuration
        onChangeExampleCode={value => {
          const code = exampleCode[value].replace(
            /'.*(validator|type_name|fast_checker)'/g,
            "'reify-ts/lib/consumers/$1'",
          );
          onTypeScriptChange(code);
          setDebouncedTypeScript(code);
        }}
        visitorMap={visitorMap}
        onChangeVisitorMap={onChangeVisitorMap}
      />
      <Row>
        <Col span={12}>
          <Code
            title="TypeScript (index.ts)"
            mode={{ name: 'javascript', typescript: true }}
            value={typeScript}
            onChange={onTypeScriptChange}
          />
        </Col>
        <Col span={12}>
          <Code
            title="AST"
            value={JSON.stringify(ast, null, 2)}
            mode={{ name: 'javascript', json: true }}
          />
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Code
            title="Generated code"
            value={generatedCode}
            mode={{ name: 'javascript', typescript: true }}
          />
        </Col>
        <Col span={12}>
          <Code title="Console" value={console} />
        </Col>
      </Row>
      <Consumers ast={ast} />
    </div>
  );
}

function Configuration(props: {
  onChangeExampleCode: (value: string) => void;
  visitorMap: VisitorMap;
  onChangeVisitorMap: (value: VisitorMap) => void;
}) {
  return (
    <Row>
      <Col span={12} style={{ padding: '5px', height: '80px' }}>
        <h4>Preset</h4>
        <Select style={{ width: '100%' }} onChange={props.onChangeExampleCode}>
          {Object.keys(exampleCode).map(it => (
            <Select.Option key={it}>{it}</Select.Option>
          ))}
        </Select>
      </Col>
      <Col span={12} style={{ padding: '5px', height: '80px' }}>
        <h4>Visitors</h4>
        <Checkbox
          checked={!!props.visitorMap[VisitorClassName.allTypes]}
          onChange={e => {
            const checked = e.target.checked;
            props.onChangeVisitorMap({
              ...props.visitorMap,
              [VisitorClassName.allTypes]: !checked ? undefined : {},
            });
          }}
        >
          All exported types
        </Checkbox>
        <Checkbox
          checked={!!props.visitorMap[VisitorClassName.placeholderCalls]}
          onChange={e => {
            const checked = e.target.checked;
            props.onChangeVisitorMap({
              ...props.visitorMap,
              [VisitorClassName.placeholderCalls]: !checked ? undefined : {},
            });
          }}
        >
          Codec calls
        </Checkbox>
      </Col>
    </Row>
  );
}

function Consumers(props: { ast: TypeEntry[] }) {
  const [typeNameForConsumers, setTypeNameForConsumers] = React.useState<
    string | undefined
  >(undefined);
  React.useEffect(
    () => {
      if (!typeNameForConsumers && props.ast.length > 0) {
        setTypeNameForConsumers(props.ast[0].name);
      }
      if (
        typeNameForConsumers &&
        !props.ast.find(it => it.name === typeNameForConsumers)
      ) {
        setTypeNameForConsumers(undefined);
      }
    },
    [props.ast, typeNameForConsumers],
  );
  const { sampleValues, sampleValuesConsole } = React.useMemo(
    () => {
      if (
        !typeNameForConsumers ||
        !props.ast.find(it => it.name === typeNameForConsumers)
      ) {
        return { sampleValues: [], sampleValuesConsole: '' };
      }
      try {
        return {
          sampleValues: getSampleValues(props.ast, typeNameForConsumers),
          sampleValuesConsole: '',
        };
      } catch (err) {
        return {
          sampleValues: [],
          sampleValuesConsole: err.stack,
        };
      }
    },
    [props.ast, typeNameForConsumers],
  );
  const [valueToCheck, setValueToCheck] = React.useState('');
  React.useEffect(
    () => {
      if (sampleValues.length > 0) {
        setValueToCheck(JSON.stringify(sampleValues[0], null, 2));
      }
    },
    [sampleValues],
  );
  const validationConsole = React.useMemo(
    () => {
      if (!valueToCheck || !typeNameForConsumers) {
        return '';
      }

      try {
        validateValue(
          JSON.parse(valueToCheck),
          props.ast,
          typeNameForConsumers,
        );
      } catch (err) {
        return err.stack;
      }
    },
    [valueToCheck, typeNameForConsumers],
  );

  return (
    <>
      <Row>
        <Col span={24} style={{ padding: '5px' }}>
          <h2 style={{ margin: '0.5em 0', fontSize: '21px' }}>Consumers</h2>
        </Col>
      </Row>
      <Row>
        <Col span={12} style={{ padding: '5px' }}>
          <h4>Type</h4>
          <Select
            style={{ width: '100%' }}
            value={typeNameForConsumers}
            onChange={setTypeNameForConsumers}
          >
            {props.ast.map(it => (
              <Select.Option key={it.name}>{it.name}</Select.Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Row>
        <Col span={8}>
          <Code
            title="Sample values"
            mode={{ name: 'javascript', json: true }}
            value={JSON.stringify(sampleValues, null, 2)}
          />
        </Col>
        <Col span={8}>
          <Code
            title="Value to check"
            mode={{ name: 'javascript', json: true }}
            value={valueToCheck}
            onChange={setValueToCheck}
          />
        </Col>
        <Col span={8}>
          <Code
            title="Console"
            value={[sampleValuesConsole, validationConsole]
              .filter(it => !!it)
              .join('\n\n')}
          />
        </Col>
      </Row>
    </>
  );
}

function Code(props: {
  title: string;
  value: string;
  mode?: any;
  onChange?: (nextValue: string) => void;
}) {
  return (
    <Card
      title={props.title}
      bordered={false}
      headStyle={{ padding: 0, paddingLeft: '5px' }}
      bodyStyle={{ padding: 0 }}
    >
      <CodeMirror.Controlled
        options={{
          mode: props.mode,
          theme: 'base16-light',
          lineNumbers: true,
        }}
        value={props.value}
        onBeforeChange={(_editor, _data, value) => {
          if (props.onChange) {
            props.onChange(value);
          }
        }}
      />
    </Card>
  );
}
