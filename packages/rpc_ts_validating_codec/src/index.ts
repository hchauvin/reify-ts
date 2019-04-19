/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from 'io-ts';
import { ModuleRpcProtocolGrpcWebCommon } from 'rpc_ts/lib/protocol/grpc_web/common';
import { ModuleRpcCommon } from 'rpc_ts/lib/common';
import { ModuleRpcServer } from 'rpc_ts/lib/server';
import { checkPassThrough } from 'reify-ts/lib/runtime/pass_through';
import { Validator } from 'reify-ts/lib/consumers/validator';
import { grpc } from 'grpc-web-client';
import { Kind, TypeEntry } from 'reify-ts/lib/types';
import { BaseError } from 'make-error';
import { PathReporter } from 'io-ts/lib/PathReporter';

export function getValidatingCodec<
  serviceDefinition extends ModuleRpcCommon.ServiceDefinition
>(
  codecFactory: ValidatingCodecFactory,
  _serviceDefinition: serviceDefinition,
): ModuleRpcProtocolGrpcWebCommon.GrpcWebCodec<serviceDefinition> {
  checkPassThrough();
  return codecFactory.underlyingCodec;
}

export class ValidatingCodecFactory {
  constructor(
    public readonly validator: Validator,
    public readonly underlyingCodec: ModuleRpcProtocolGrpcWebCommon.GrpcWebCodec = new ModuleRpcProtocolGrpcWebCommon.GrpcWebJsonCodec(),
  ) {}

  get(serviceDefinitionTypeName: string): ValidatingCodec {
    return new ValidatingCodec(
      this.validator,
      serviceDefinitionTypeName,
      this.underlyingCodec,
    );
  }
}

export class ValidatingCodec
  implements ModuleRpcProtocolGrpcWebCommon.GrpcWebCodec {
  constructor(
    private readonly validator: Validator,
    private readonly serviceDefinitionTypeName: string,
    private readonly underlyingCodec: ModuleRpcProtocolGrpcWebCommon.GrpcWebCodec = new ModuleRpcProtocolGrpcWebCommon.GrpcWebJsonCodec(),
  ) {}

  /** @override */
  getContentType(): string {
    return this.underlyingCodec.getContentType();
  }

  /** @override */
  encodeRequest(method: string, message: any): Uint8Array {
    return this.underlyingCodec.encodeRequest(
      method,
      this.getValidatorForMethod(method, 'request').encode(message),
    );
  }

  /** @override */
  decodeRequest(method: string, message: Uint8Array): any {
    const validation = this.getValidatorForMethod(method, 'request').decode(
      this.underlyingCodec.decodeRequest(method, message),
    );
    if (validation.isLeft()) {
      throw this.getValidationError(validation);
    }
    return validation.value;
  }

  /** @override */
  encodeMessage(method: string, message: any): Uint8Array {
    return this.underlyingCodec.encodeMessage(
      method,
      this.getValidatorForMethod(method, 'response').encode(message),
    );
  }

  /** @override */
  decodeMessage(method: string, encodedMessage: Uint8Array): any {
    const validation = this.getValidatorForMethod(method, 'response').decode(
      this.underlyingCodec.decodeMessage(method, encodedMessage),
    );
    if (validation.isLeft()) {
      throw this.getValidationError(validation);
    }
    return validation.value;
  }

  /** @override */
  encodeTrailer(metadata: grpc.Metadata): Uint8Array {
    return this.underlyingCodec.encodeTrailer(metadata);
  }

  /** @override */
  decodeTrailer(encodedTrailer: Uint8Array): grpc.Metadata {
    return this.underlyingCodec.decodeTrailer(encodedTrailer);
  }

  private getValidatorForMethod(
    method: string,
    payload: 'request' | 'response',
  ): t.Mixed {
    const serviceDefinitionType = this.validator.ast.getType(
      this.serviceDefinitionTypeName,
    );
    if (serviceDefinitionType.type.kind !== Kind.record) {
      throw new ServiceDefinitionTypeError(
        serviceDefinitionType,
        'expected record',
      );
    }
    const methodDefinitionType = serviceDefinitionType.type.fields[method];
    if (!methodDefinitionType) {
      throw new ServiceDefinitionTypeError(serviceDefinitionType, 'no method');
    }
    if (methodDefinitionType.type.kind !== Kind.record) {
      throw new ServiceDefinitionTypeError(
        serviceDefinitionType,
        'expected record',
      );
    }
    const payloadType = methodDefinitionType.type.fields[payload];
    if (!payloadType) {
      throw new ServiceDefinitionTypeError(
        serviceDefinitionType,
        'expected payload',
      );
    }
    return this.validator.getValidatorForType(payloadType.type);
  }

  private getValidationError(
    validation: t.Validation<any>,
  ): ModuleRpcServer.ServerRpcError {
    return new ModuleRpcServer.ServerRpcError(
      ModuleRpcCommon.RpcErrorType.invalidArgument,
      undefined,
      PathReporter.report(validation).join('\n'),
    );
  }
}

export class ServiceDefinitionTypeError extends BaseError {
  constructor(typeEntry: TypeEntry, message: string) {
    super(`${message}; typeEntry: ${JSON.stringify(typeEntry, null, 2)}`);
  }
}
