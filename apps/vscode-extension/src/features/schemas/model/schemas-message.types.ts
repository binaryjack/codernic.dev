export type SchemasMessageType = 'list' | 'create' | 'open' | 'save' | 'delete' | 'rename';

export interface SchemasListMessage {
  type: 'list';
}

export interface SchemasCreateMessage {
  type: 'create';
  id?: string;
  data?: Record<string, unknown>;
}

export interface SchemasOpenMessage {
  type: 'open';
  id: string;
}

export interface SchemasSaveMessage {
  type: 'save';
  id: string;
  data: Record<string, unknown>;
}

export interface SchemasDeleteMessage {
  type: 'delete';
  id: string;
}

export interface SchemasRenameMessage {
  type: 'rename';
  id: string;
  newName: string;
}

export type SchemasMessage =
  | SchemasListMessage
  | SchemasCreateMessage
  | SchemasOpenMessage
  | SchemasSaveMessage
  | SchemasDeleteMessage
  | SchemasRenameMessage;

export interface SchemaFileMeta {
  id: string;
  slug: string;
  name: string;
  type: string;
  path: string;
  createdAt: number;
  updatedAt: number;
}

export interface SchemasListResponse {
  type: 'list-response';
  schemas: SchemaFileMeta[];
}

export interface SchemasGenericResponse {
  type: 'response';
  success: boolean;
  message?: string;
}

export type SchemasResponse = SchemasListResponse | SchemasGenericResponse;
