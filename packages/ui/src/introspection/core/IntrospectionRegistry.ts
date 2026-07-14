export interface IntrospectionSchema {
  id: string;
  type: string;
  slice?: string;
  methods: Record<string, Function>;
  metadata?: Record<string, any>;
}

export class IntrospectionRegistry {
  private schemas = new Map<string, IntrospectionSchema>();

  public register(schema: IntrospectionSchema) {
    this.schemas.set(schema.id, schema);
    console.debug(`[IntrospectionRegistry] Registered schema for ${schema.id}`);
  }

  public unregister(id: string) {
    this.schemas.delete(id);
    console.debug(`[IntrospectionRegistry] Unregistered schema for ${id}`);
  }

  public get(id: string): IntrospectionSchema | undefined {
    return this.schemas.get(id);
  }

  public getAll(): IntrospectionSchema[] {
    return Array.from(this.schemas.values());
  }

  public getByType(type: string): IntrospectionSchema[] {
    return this.getAll().filter(s => s.type === type);
  }
}

// Global instance attached to window for agnostic access
const globalRegistry = new IntrospectionRegistry();

if (typeof window !== 'undefined') {
  (window as any).__INTROSPECTION__ = globalRegistry;
}

export const getIntrospectionRegistry = () => globalRegistry;
