/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as http from 'http';
import { ModuleRpcCommon } from 'rpc_ts/lib/common';
import { ModuleRpcServer } from 'rpc_ts/lib/server';
import { ModuleRpcProtocolGrpcWebServer } from 'rpc_ts/lib/protocol/grpc_web/server';
import { ModuleRpcProtocolClient } from 'rpc_ts/lib/protocol/client';
import { ModuleRpcContextServer } from 'rpc_ts/lib/context/server';
import {
  getValidatingCodec,
  ValidatingCodecFactory,
} from 'rpc-ts-validating-codec';
import { disablePassThrough } from 'reify-ts/lib/runtime/pass_through';
import { Validator } from 'reify-ts/lib/consumers/validator';
import { AddressInfo } from 'net';
import { ModuleRpcClient } from 'rpc_ts/lib/client';
import { TypeMirror } from 'reify-ts/lib/runtime/type_mirror';

// Definition of the RPC service
const helloServiceDefinition = {
  getHello: {
    request: {} as {
      /** The language in which to say "Hello". */
      language: string;
    },
    response: {} as {
      text: string;
    },
  },
};

/** Implementation of an RPC server. */
function rpcServer(): http.Server {
  const typeMirror = new TypeMirror(
    JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../types.json'), 'utf8'),
    ),
  );
  const validatingCodecFactory = new ValidatingCodecFactory(
    new Validator(typeMirror),
  );

  const app = express();
  const handler: ModuleRpcServer.ServiceHandlerFor<
    typeof helloServiceDefinition
  > = {
    async getHello({ language }) {
      if (language === 'Spanish') return { text: 'Hola' };
      throw new ModuleRpcServer.ServerRpcError(
        ModuleRpcCommon.RpcErrorType.notFound,
        `language '${language}' not found`,
      );
    },
  };
  app.use(
    ModuleRpcProtocolGrpcWebServer.registerGrpcWebRoutes(
      helloServiceDefinition,
      handler,
      new ModuleRpcContextServer.EmptyServerContextConnector(),
      {
        codec: getValidatingCodec(
          validatingCodecFactory,
          helloServiceDefinition,
        ),
        reportError: (err, _ctx) => console.error(err),
      },
    ),
  );
  return http.createServer(app).listen();
}

// Now let's do a Remote Procedure Call
async function main() {
  disablePassThrough(true);

  const server = rpcServer();

  try {
    const remoteAddress = `http://localhost:${
      (server.address() as AddressInfo).port
    }`;

    // Valid request
    const { text } = await ModuleRpcProtocolClient.getRpcClient(
      helloServiceDefinition,
      {
        remoteAddress,
      },
    ).getHello({ language: 'Spanish' });
    if (text !== 'Hola') {
      throw new Error('unexpected text');
    }

    // Invalid request
    try {
      await ModuleRpcProtocolClient.getRpcClient(helloServiceDefinition, {
        remoteAddress,
      }).getHello({ foo: 'bar' } as any);
      throw new Error('expected an invalidArgument error');
    } catch (err) {
      if (!(err instanceof ModuleRpcClient.ClientRpcError)) {
        throw new Error('expected a Client RpcError error');
      }
      if (err.errorType !== ModuleRpcCommon.RpcErrorType.invalidArgument) {
        throw new Error('expected an invalidArgument error');
      }
      if (
        err.msg !==
        'Invalid value undefined supplied to : { language: string }/language: string'
      ) {
        throw new Error('unexpected message');
      }
    }
  } finally {
    server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
