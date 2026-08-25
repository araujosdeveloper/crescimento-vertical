import type { ICredentialType, INodeProperties } from '../src/n8n-types';

export class CrescimentoVerticalHermesApi implements ICredentialType {
  name = 'crescimentoVerticalHermesApi';
  displayName = 'Crescimento Vertical Hermes API';
  documentationUrl = 'https://crescimentovertical.com';

  properties: INodeProperties[] = [
    {
      displayName: 'Runner Base URL',
      name: 'runnerBaseUrl',
      type: 'string',
      default: 'http://cv-hermes-editorial-runner:8100',
      placeholder: 'http://cv-hermes-editorial-runner:8100',
      description:
        'URL interna do runner. Deve ser http://cv-hermes-editorial-runner:8100 (somente rede Docker).',
      required: true,
    },
    {
      displayName: 'HMAC Secret',
      name: 'hmacSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Segredo HMAC do runner (armazenado criptografado pelo n8n).',
      required: true,
    },
  ];
}
