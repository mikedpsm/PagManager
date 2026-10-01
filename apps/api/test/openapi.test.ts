import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { createApp } from '../src/app.js';
import {
  authedRequest,
  closeTestApp,
  createTestApp,
  registerUser,
  type TestApp,
} from './helpers/testApp.js';

type Method = 'get' | 'post' | 'patch' | 'delete';
type JsonSchema = {
  $ref?: string;
  type?: string | string[];
  format?: string;
  description?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  nullable?: boolean;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  [key: string]: unknown;
};
type Operation = {
  operationId?: string;
  description?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: JsonSchema;
  }>;
  requestBody?: {
    required?: boolean;
    description?: string;
    content?: Record<string, { schema?: JsonSchema }>;
  };
  responses: Record<
    string,
    {
      description?: string;
      content?: Record<string, { schema?: JsonSchema }>;
    }
  >;
};
type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Partial<Record<Method, Operation>>>;
  components: {
    schemas?: Record<string, JsonSchema>;
    securitySchemes?: Record<string, Record<string, unknown>>;
  };
};

const expectedOperations: Array<[Method, string]> = [
  ['get', '/health'],
  ['get', '/api/v1/health'],
  ['post', '/api/v1/auth/register'],
  ['post', '/api/v1/auth/login'],
  ['post', '/api/v1/auth/check-email'],
  ['get', '/api/v1/me'],
  ['patch', '/api/v1/me'],
  ['get', '/api/v1/clients'],
  ['post', '/api/v1/clients'],
  ['get', '/api/v1/clients/{id}'],
  ['patch', '/api/v1/clients/{id}'],
  ['delete', '/api/v1/clients/{id}'],
  ['get', '/api/v1/invoices'],
  ['post', '/api/v1/invoices'],
  ['get', '/api/v1/invoices/{id}'],
  ['patch', '/api/v1/invoices/{id}'],
  ['post', '/api/v1/invoices/{id}/pay'],
  ['delete', '/api/v1/invoices/{id}'],
  ['get', '/api/v1/dashboard/summary'],
];

function resolveSchema(
  schema: JsonSchema | undefined,
  document: OpenApiDocument,
  seen = new Set<string>(),
): JsonSchema | undefined {
  if (!schema) return undefined;

  if (schema.$ref) {
    const name = schema.$ref.split('/').at(-1);
    if (!name || seen.has(name)) return schema;
    const referenced = document.components.schemas?.[name];
    if (!referenced) return schema;
    const nextSeen = new Set(seen).add(name);
    return resolveSchema(referenced, document, nextSeen);
  }

  const resolved: JsonSchema = { ...schema };
  for (const key of ['properties', 'items']) {
    const value = schema[key];
    if (Array.isArray(value)) {
      resolved[key] = value.map((item) =>
        resolveSchema(item as JsonSchema, document, seen),
      );
    } else if (value && typeof value === 'object') {
      if (key === 'properties') {
        resolved[key] = Object.fromEntries(
          Object.entries(value).map(([property, propertySchema]) => [
            property,
            resolveSchema(propertySchema as JsonSchema, document, seen),
          ]),
        );
      } else {
        resolved[key] = resolveSchema(value as JsonSchema, document, seen);
      }
    }
  }

  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    const value = schema[key];
    if (Array.isArray(value)) {
      resolved[key] = value.map((item) =>
        resolveSchema(item as JsonSchema, document, seen),
      );
    }
  }

  return resolved;
}

function operationFor(
  document: OpenApiDocument,
  method: Method,
  path: string,
): Operation {
  const operation = document.paths[path]?.[method];
  expect(operation, `${method.toUpperCase()} ${path}`).toBeDefined();
  return operation as Operation;
}

function responseSchema(
  document: OpenApiDocument,
  operation: Operation,
  status: number,
): JsonSchema | undefined {
  const schema =
    operation.responses[String(status)]?.content?.['application/json']?.schema;
  return resolveSchema(schema, document);
}

function requestSchema(
  document: OpenApiDocument,
  operation: Operation,
): JsonSchema | undefined {
  const schema = operation.requestBody?.content?.['application/json']?.schema;
  return resolveSchema(schema, document);
}

describe('OpenAPI document', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;
  let document: OpenApiDocument;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    const response = await app.request('/openapi.json');
    expect(response.status).toBe(200);
    document = (await response.json()) as OpenApiDocument;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('preserves PATCH body and JSON validation behavior at runtime', async () => {
    const { token } = await registerUser(app, {
      email: 'openapi-patch@example.com',
      username: 'OpenAPI Patch User',
    });
    const asUser = authedRequest(app, token);

    const profile = await asUser('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({
        username: 'Profile baseline',
        phone: '11999999999',
      }),
    });
    expect(profile.status).toBe(200);

    const clientResponse = await asUser('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Client baseline',
        email: 'openapi-client@example.com',
        cpf: '00000000353',
        phone: '11999999999',
      }),
    });
    expect(clientResponse.status).toBe(201);
    const clientId = (await clientResponse.json()).id as string;

    const invoiceResponse = await asUser('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        description: 'Invoice baseline',
        amountCents: 1000,
        dueDate: '2099-12-31',
      }),
    });
    expect(invoiceResponse.status).toBe(201);
    const invoiceId = (await invoiceResponse.json()).id as string;

    const authHeaders = { Authorization: `Bearer ${token}` };
    const jsonHeaders = {
      ...authHeaders,
      'Content-Type': 'application/json',
    };
    const patchCases = [
      {
        path: '/api/v1/me',
        field: 'username',
        value: 'Profile baseline',
      },
      {
        path: `/api/v1/clients/${clientId}`,
        field: 'username',
        value: 'Client baseline',
      },
      {
        path: `/api/v1/invoices/${invoiceId}`,
        field: 'description',
        value: 'Invoice baseline',
      },
    ];

    async function expectUnchanged(
      response: Response,
      field: string,
      value: string,
    ) {
      expect(response.status).toBe(200);
      expect((await response.json())[field]).toBe(value);
    }

    async function expectValidationError(response: Response) {
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
      });
    }

    for (const patchCase of patchCases) {
      const omittedBody = await app.request(patchCase.path, {
        method: 'PATCH',
        headers: authHeaders,
      });
      await expectUnchanged(omittedBody, patchCase.field, patchCase.value);

      const emptyObject = await app.request(patchCase.path, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: '{}',
      });
      await expectUnchanged(emptyObject, patchCase.field, patchCase.value);

      const emptyJsonBody = await app.request(patchCase.path, {
        method: 'PATCH',
        headers: jsonHeaders,
      });
      await expectValidationError(emptyJsonBody);

      const malformedJson = await app.request(patchCase.path, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: '{',
      });
      await expectValidationError(malformedJson);
    }

    const registerWithoutContentType = await app.request(
      '/api/v1/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          username: 'No content type',
          email: 'no-content-type@example.com',
          passwd: 'valid-password',
        }),
      },
    );
    await expectValidationError(registerWithoutContentType);

    const loginWithoutContentType = await app.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'openapi-patch@example.com',
        passwd: 'valid-password',
      }),
    });
    await expectValidationError(loginWithoutContentType);
  });

  it('documents every implemented API operation with unique operation IDs', () => {
    expect(document.openapi).toBe('3.1.0');
    expect(document.info).toEqual({
      title: 'PagManager API',
      version: '0.1.0',
    });

    const actualOperations = Object.entries(document.paths).flatMap(
      ([path, pathItem]) =>
        Object.keys(pathItem)
          .filter((method): method is Method =>
            ['get', 'post', 'patch', 'delete'].includes(method),
          )
          .map((method) => [method, path] as [Method, string]),
    );

    expect(actualOperations.sort()).toEqual(expectedOperations.sort());

    const operationIds = actualOperations.map(
      ([method, path]) => operationFor(document, method, path).operationId,
    );
    expect(operationIds.every((operationId) => Boolean(operationId))).toBe(
      true,
    );
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it('documents bounded request bodies, auth rate limits, and generic health failures', () => {
    for (const [method, path] of expectedOperations) {
      const operation = operationFor(document, method, path);
      if (operation.requestBody) {
        expect(
          operation.responses['413'],
          `${method.toUpperCase()} ${path}`,
        ).toBeDefined();
      }
    }

    for (const path of [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/check-email',
    ]) {
      expect(
        operationFor(document, 'post', path).responses['429'],
      ).toBeDefined();
    }

    for (const path of ['/health', '/api/v1/health']) {
      const failure = responseSchema(
        document,
        operationFor(document, 'get', path),
        503,
      );
      expect(failure?.properties).toHaveProperty('status');
      expect(failure?.properties).not.toHaveProperty('message');
    }
  });

  it('declares JWT bearer authentication only on protected operations', () => {
    expect(document.components.securitySchemes?.BearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });

    const publicOperations: Array<[Method, string]> = [
      ['get', '/health'],
      ['get', '/api/v1/health'],
      ['post', '/api/v1/auth/register'],
      ['post', '/api/v1/auth/login'],
      ['post', '/api/v1/auth/check-email'],
    ];
    for (const [method, path] of publicOperations) {
      expect(operationFor(document, method, path).security).toBeUndefined();
    }

    for (const [method, path] of expectedOperations) {
      if (
        publicOperations.some(
          ([publicMethod, publicPath]) =>
            publicMethod === method && publicPath === path,
        )
      ) {
        continue;
      }
      expect(operationFor(document, method, path).security).toEqual([
        { BearerAuth: [] },
      ]);
    }
  });

  it('documents UUID path parameters and list filters with their real enums', () => {
    const idOperations: Array<[Method, string]> = [
      ['get', '/api/v1/clients/{id}'],
      ['patch', '/api/v1/clients/{id}'],
      ['delete', '/api/v1/clients/{id}'],
      ['get', '/api/v1/invoices/{id}'],
      ['patch', '/api/v1/invoices/{id}'],
      ['post', '/api/v1/invoices/{id}/pay'],
      ['delete', '/api/v1/invoices/{id}'],
    ];
    for (const [method, path] of idOperations) {
      const id = operationFor(document, method, path).parameters?.find(
        (parameter) => parameter.name === 'id' && parameter.in === 'path',
      );
      expect(id?.required).toBe(true);
      expect(id?.schema?.format).toBe('uuid');
    }

    const clientParameters = operationFor(
      document,
      'get',
      '/api/v1/clients',
    ).parameters;
    expect(clientParameters?.map(({ name }) => name).sort()).toEqual([
      'search',
      'sort',
      'status',
    ]);
    expect(
      clientParameters?.find(({ name }) => name === 'search')?.schema,
    ).toMatchObject({ type: 'string' });
    expect(
      clientParameters?.find(({ name }) => name === 'status')?.schema,
    ).toMatchObject({ enum: ['overdue', 'ok'] });
    expect(
      clientParameters?.find(({ name }) => name === 'sort')?.schema,
    ).toMatchObject({ enum: ['username', '-username'] });
    expect(clientParameters?.every(({ required }) => required !== true)).toBe(
      true,
    );

    const invoiceParameters = operationFor(
      document,
      'get',
      '/api/v1/invoices',
    ).parameters;
    expect(invoiceParameters?.map(({ name }) => name).sort()).toEqual([
      'clientId',
      'status',
    ]);
    expect(
      invoiceParameters?.find(({ name }) => name === 'clientId')?.schema,
    ).toMatchObject({ format: 'uuid' });
    expect(
      invoiceParameters?.find(({ name }) => name === 'status')?.schema,
    ).toMatchObject({ enum: ['paid', 'pending', 'overdue'] });
  });

  it('describes request and response envelopes, including int32 invoice inputs and partial PATCH bodies', () => {
    const clientList = operationFor(document, 'get', '/api/v1/clients');
    const invoiceList = operationFor(document, 'get', '/api/v1/invoices');
    expect(responseSchema(document, clientList, 200)?.type).toBe('array');
    expect(responseSchema(document, invoiceList, 200)?.type).toBe('array');

    const register = operationFor(document, 'post', '/api/v1/auth/register');
    expect(register.requestBody?.required).toBe(true);
    expect(requestSchema(document, register)?.properties).toHaveProperty(
      'passwd',
    );
    expect(responseSchema(document, register, 201)?.properties).toHaveProperty(
      'token',
    );

    const createInvoice = operationFor(document, 'post', '/api/v1/invoices');
    expect(createInvoice.requestBody?.required).toBe(true);
    expect(requestSchema(document, createInvoice)?.properties).toMatchObject({
      amountCents: { type: 'integer', minimum: 0, maximum: 2_147_483_647 },
      clientId: { format: 'uuid' },
      dueDate: { format: 'date' },
    });

    const patchMe = operationFor(document, 'patch', '/api/v1/me');
    const patchClient = operationFor(document, 'patch', '/api/v1/clients/{id}');
    const patchInvoice = operationFor(
      document,
      'patch',
      '/api/v1/invoices/{id}',
    );
    expect(patchMe.requestBody?.required).not.toBe(true);
    expect(patchClient.requestBody?.required).not.toBe(true);
    expect(patchInvoice.requestBody?.required).not.toBe(true);
    for (const operation of [patchMe, patchClient, patchInvoice]) {
      expect(operation.requestBody?.description).toContain('no-op');
    }

    const invoiceResponse = responseSchema(
      document,
      operationFor(document, 'get', '/api/v1/invoices/{id}'),
      200,
    );
    expect(invoiceResponse?.type).toBe('object');
    expect(invoiceResponse?.properties).toHaveProperty('paidAt');
    const paidAt = JSON.stringify(invoiceResponse?.properties?.paidAt);
    expect(paidAt).toContain('date-time');
    expect(paidAt.includes('null') || paidAt.includes('nullable')).toBe(true);

    const deleteClient = operationFor(
      document,
      'delete',
      '/api/v1/clients/{id}',
    );
    expect(deleteClient.responses['204']?.content).toBeUndefined();
    expect(responseSchema(document, deleteClient, 204)).toBeUndefined();
  });

  it('uses the shared error envelope and keeps contact responses permissive', () => {
    const sharedErrorOperations: Array<[Method, string, number]> = [
      ['post', '/api/v1/auth/register', 400],
      ['post', '/api/v1/auth/login', 401],
      ['get', '/api/v1/clients/{id}', 404],
      ['patch', '/api/v1/clients/{id}', 409],
      ['get', '/api/v1/dashboard/summary', 500],
    ];
    for (const [method, path, status] of sharedErrorOperations) {
      expect(
        responseSchema(document, operationFor(document, method, path), status)
          ?.properties,
      ).toHaveProperty('code');
      expect(
        responseSchema(document, operationFor(document, method, path), status)
          ?.properties,
      ).toHaveProperty('message');
    }

    const createClient = operationFor(document, 'post', '/api/v1/clients');
    const clientInput = requestSchema(document, createClient);
    const clientInputProperties = clientInput?.properties as
      | Record<string, JsonSchema>
      | undefined;
    expect(clientInputProperties?.phone.description).toContain('DDD');
    expect(clientInput?.required).toContain('phone');
    expect(clientInput?.required).not.toContain('cep');

    const clientOutput = responseSchema(
      document,
      operationFor(document, 'get', '/api/v1/clients/{id}'),
      200,
    );
    const outputPhone = (
      clientOutput?.properties as Record<string, JsonSchema> | undefined
    )?.phone;
    expect(outputPhone?.type).toBe('string');
    expect(outputPhone?.pattern).toBeUndefined();

    const meUpdate = operationFor(document, 'patch', '/api/v1/me');
    expect(meUpdate.description).toContain('10 or 11 digits');
  });

  it('does not disclose password hashes or configured secrets', () => {
    const serialized = JSON.stringify(document);
    expect(serialized).not.toMatch(
      /passwordHash|jwtSecret|test-secret|supersecret/i,
    );
  });
});
