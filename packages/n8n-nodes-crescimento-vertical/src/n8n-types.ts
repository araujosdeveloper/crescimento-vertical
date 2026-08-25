/**
 * Tipos mínimos compatíveis com a API clássica de nós do n8n (v2).
 *
 * Estes tipos existem APENAS para compilação estática do pacote, sem depender
 * dos pacotes pesados `n8n-workflow`/`n8n-core` (que puxam dependências
 * nativas). Em runtime o n8n fornece as classes reais; o código compilado não
 * faz `require` de nenhum pacote do n8n.
 */

export interface INodePropertyOption {
  name: string;
  value: string;
  description?: string;
}

export interface INodeProperties {
  displayName: string;
  name: string;
  type: string;
  default?: unknown;
  description?: string;
  placeholder?: string;
  required?: boolean;
  noDataExpression?: boolean;
  typeOptions?: Record<string, unknown>;
  options?: INodePropertyOption[];
  displayOptions?: {
    show?: Record<string, string[]>;
  };
}

export interface INodeTypeDescription {
  displayName: string;
  name: string;
  icon?: string;
  group: string[];
  version: number;
  subtitle?: string;
  description: string;
  defaults: {
    name: string;
  };
  inputs: string[];
  outputs: string[];
  credentials?: Array<{ name: string; required: boolean }>;
  properties: INodeProperties[];
}

export interface INodeType {
  description: INodeTypeDescription;
  execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}

export interface ICredentialType {
  name: string;
  displayName: string;
  documentationUrl?: string;
  properties: INodeProperties[];
}

export interface INodeExecutionData {
  json: Record<string, unknown>;
  pairedItem?: { item: number };
  [key: string]: unknown;
}

export interface IExecuteFunctions {
  getCredentials(type: string): Promise<Record<string, unknown>>;
  getNodeParameter(
    name: string,
    itemIndex: number,
    fallback?: unknown,
  ): unknown;
  getInputData(): Array<{ json: Record<string, unknown> }>;
  helpers: Record<string, unknown>;
}
