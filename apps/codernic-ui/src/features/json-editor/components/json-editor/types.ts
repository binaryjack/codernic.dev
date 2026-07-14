export interface JsonEditorSchemaField {
  type: string;
  sourceFile?: string;
  sourceAssetType?: string;
  sourceAssetId?: string;
  sourceCollection?: string;
  labelField?: string;
  valueField?: string;
  behavior?: string;
  dependsOn?: string;
  dependsOnType?: string;
  fromField?: string;
  onField?: string;
}

export type JsonEditorSchema = Record<string, JsonEditorSchemaField>;

export interface JsonEditorProps {
  value: any;
  onChange: (newValue: any) => void;
  path?: string[];
  schema?: JsonEditorSchema | any;
  parentValue?: any;
  rootValue?: any;
  isSplitView?: boolean;
  fieldName?: string;
  fieldSchema?: any;
}
