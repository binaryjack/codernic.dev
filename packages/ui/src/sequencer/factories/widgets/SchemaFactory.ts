import { createUniversalSchema, createDagExchange, createAppSettings } from '@binaryjack/state-factories';

export class SchemaFactory {
  static createArchitectSchemaMock() {
    return createUniversalSchema({
      config: {
        workspace: {
          name: "Mock Architect Workspace",
          version: "1",
          last_modified: new Date().toISOString(),
          active_canvas_id: "canvas-architect",
          canvases: {
            "canvas-architect": {
              id: "canvas-architect",
              name: "Canvas Architect",
              active_schema_id: "schema-architect",
              viewport: { pan: { x: 0, y: 0 }, zoom: 1 },
              schemas: {
                "schema-architect": {
                  id: "schema-architect",
                  name: "Full System Architecture",
                  type: "freeform",
                  entities: [
                    { id: '1', name: 'Backend API Component', type: 'service', position: {x:200, y:200}, dimensions: {width: 200, height: 160}, properties: [{ key: 'p1', label: 'Language', dataType: 'string', componentType: 'input', value: 'Rust' }, { key: 'p2', label: 'Version', dataType: 'string', componentType: 'input', value: '1.74' }], edges: [] },
                    { id: '2', name: 'Database Cluster', type: 'database', position: {x:500, y:200}, dimensions: {width: 200, height: 160}, properties: [{ key: 'p3', label: 'Engine', dataType: 'string', componentType: 'input', value: 'PostgreSQL' }, { key: 'p4', label: 'Replicas', dataType: 'number', componentType: 'input', value: 3 }], edges: [] }
                  ],
                  links: [
                    { id: 'e1-2', leftEntityId: '1', rightEntityId: '2', leftAnchorId: 'right', rightAnchorId: 'left', leftCardinality: '1', rightCardinality: 'n', renderType: 'bezier', direction: 'forward' }
                  ]
                }
              }
            }
          }
        }
      } as any
    });
  }

  static createDispatchAction() {
    return {
      type: 'dag/setErathosSchema',
      payload: this.createArchitectSchemaMock()
    };
  }
}
