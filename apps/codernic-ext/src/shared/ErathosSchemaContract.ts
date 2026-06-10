export interface ErathosNodeTemplate {
  type?: string;
  properties?: Record<string, any>;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface ErathosSchemaContract {
  success: boolean;
  templates: Record<string, ErathosNodeTemplate>;
}
