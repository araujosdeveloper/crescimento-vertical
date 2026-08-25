import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../../src/n8n-types';

import { HermesApiError, toSafeMessage } from '../../src/errors';
import { HermesClient } from '../../src/client';
import { validateRunnerBaseUrl } from '../../src/url';
import {
  validateResearchRequest,
  PRIMARY_PILLARS,
  type ResearchRequest,
} from '../../src/validation';

const JOB_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;

function buildResearchRequest(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
): ResearchRequest {
  const get = (name: string, fallback: unknown) =>
    executeFunctions.getNodeParameter(name, itemIndex, fallback) as unknown;

  const seedRaw = get('seedSources', '') as string;
  const seedSources = seedRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return {
    schemaVersion: '1.0',
    correlationId: get('correlationId', '') as string,
    idempotencyKey: get('idempotencyKey', '') as string,
    topic: get('topic', '') as string,
    primaryPillar: get('primaryPillar', 'ai-business') as ResearchRequest['primaryPillar'],
    searchIntent: get('searchIntent', '') as string,
    language: 'pt-BR',
    requestedAt: new Date().toISOString(),
    maxSources: get('maxSources', 5) as number,
    ...(seedSources.length > 0 ? { seedSources } : {}),
  };
}

async function runOperation(
  executeFunctions: IExecuteFunctions,
  client: HermesClient,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  switch (operation) {
    case 'health': {
      const res = await client.request('GET', '/health');
      return { operation: 'health', status: res.status, body: res.body };
    }

    case 'validateResearchRequest': {
      const request = buildResearchRequest(executeFunctions, itemIndex);
      const errors = validateResearchRequest(request);
      if (errors.length > 0) {
        throw new HermesApiError(undefined, `validação local falhou: ${errors.join(' ')}`);
      }
      const res = await client.request('POST', '/v1/validate', request);
      return { operation: 'validateResearchRequest', status: res.status, body: res.body };
    }

    case 'createJob': {
      const request = buildResearchRequest(executeFunctions, itemIndex);
      const errors = validateResearchRequest(request);
      if (errors.length > 0) {
        throw new HermesApiError(undefined, `validação local falhou: ${errors.join(' ')}`);
      }
      const res = await client.request('POST', '/v1/jobs', request);
      return { operation: 'createJob', status: res.status, body: res.body };
    }

    case 'getJob': {
      const jobId = executeFunctions.getNodeParameter('jobId', itemIndex, '') as string;
      if (!JOB_ID_PATTERN.test(jobId)) {
        throw new HermesApiError(undefined, 'jobId inválido.');
      }
      const res = await client.request('GET', `/v1/jobs/${jobId}`);
      return { operation: 'getJob', jobId, status: res.status, body: res.body };
    }

    default:
      throw new HermesApiError(undefined, `operação desconhecida: ${operation}`);
  }
}

export class HermesEditorial implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Hermes Editorial',
    name: 'hermesEditorial',
    icon: 'fa:robot',
    group: ['transform'],
    version: 1,
    subtitle: '={{ $parameter["operation"] }}',
    description:
      'Conector do runner editorial Hermes da Crescimento Vertical (validação de conectividade).',
    defaults: {
      name: 'Hermes Editorial',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'crescimentoVerticalHermesApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Health',
            value: 'health',
            description: 'GET /health — status e executionEnabled',
          },
          {
            name: 'Validate Research Request',
            value: 'validateResearchRequest',
            description: 'POST /v1/validate — valida sem executar o Hermes',
          },
          {
            name: 'Create Job',
            value: 'createJob',
            description: 'POST /v1/jobs — 503 execution_disabled nesta fase',
          },
          {
            name: 'Get Job',
            value: 'getJob',
            description: 'GET /v1/jobs/{id}',
          },
        ],
        default: 'health',
      },
      {
        displayName: 'Correlation ID',
        name: 'correlationId',
        type: 'string',
        default: '',
        placeholder: 'corr-001',
        displayOptions: {
          show: { operation: ['validateResearchRequest', 'createJob'] },
        },
        required: true,
      },
      {
        displayName: 'Idempotency Key',
        name: 'idempotencyKey',
        type: 'string',
        default: '',
        placeholder: 'key-001',
        displayOptions: {
          show: { operation: ['validateResearchRequest', 'createJob'] },
        },
        required: true,
      },
      {
        displayName: 'Topic',
        name: 'topic',
        type: 'string',
        default: '',
        placeholder: 'IA aplicada a vendas',
        displayOptions: {
          show: { operation: ['validateResearchRequest', 'createJob'] },
        },
        required: true,
      },
      {
        displayName: 'Primary Pillar',
        name: 'primaryPillar',
        type: 'options',
        noDataExpression: true,
        options: PRIMARY_PILLARS.map((value) => ({ name: value, value })),
        default: 'ai-business',
        displayOptions: {
          show: { operation: ['validateResearchRequest', 'createJob'] },
        },
        required: true,
      },
      {
        displayName: 'Search Intent',
        name: 'searchIntent',
        type: 'string',
        default: '',
        placeholder: 'Verificar impacto para empresas',
        displayOptions: {
          show: { operation: ['validateResearchRequest', 'createJob'] },
        },
        required: true,
      },
      {
        displayName: 'Max Sources',
        name: 'maxSources',
        type: 'number',
        typeOptions: { minValue: 2, maxValue: 10 },
        default: 5,
        displayOptions: {
          show: { operation: ['validateResearchRequest', 'createJob'] },
        },
        required: true,
      },
      {
        displayName: 'Seed Sources (HTTPS, vírgula-separado)',
        name: 'seedSources',
        type: 'string',
        default: '',
        placeholder: 'https://exemplo.com/doc1, https://exemplo.com/doc2',
        displayOptions: {
          show: { operation: ['validateResearchRequest', 'createJob'] },
        },
      },
      {
        displayName: 'Job ID',
        name: 'jobId',
        type: 'string',
        default: '',
        placeholder: 'job-123',
        displayOptions: {
          show: { operation: ['getJob'] },
        },
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials('crescimentoVerticalHermesApi');

    const runnerBaseUrl = validateRunnerBaseUrl(
      (credentials as { runnerBaseUrl?: unknown }).runnerBaseUrl,
    );
    const hmacSecret = (credentials as { hmacSecret?: unknown }).hmacSecret;
    if (typeof hmacSecret !== 'string' || hmacSecret.length === 0) {
      throw new Error('Credencial inválida: HMAC secret ausente.');
    }

    const client = new HermesClient({
      baseUrl: runnerBaseUrl,
      secret: hmacSecret,
    });

    const returnData: INodeExecutionData[] = [];
    const items = this.getInputData();

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const operation = this.getNodeParameter('operation', itemIndex, 'health') as string;

      let result: unknown;
      try {
        result = await runOperation(this, client, operation, itemIndex);
      } catch (error) {
        throw new HermesApiError(
          error instanceof HermesApiError ? error.statusCode : undefined,
          toSafeMessage(error),
        );
      }

      returnData.push({
        json: result as Record<string, unknown>,
        pairedItem: { item: itemIndex },
      });
    }

    return [returnData];
  }
}
