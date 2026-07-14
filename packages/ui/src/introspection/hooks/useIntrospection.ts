import { useEffect } from 'react';
import { getIntrospectionRegistry, IntrospectionSchema } from '../core/IntrospectionRegistry';

/**
 * A React Hook that registers a component with the global Introspection Registry.
 * This allows external scripts (like a TDD runner, guided tour, or QA bot) to
 * imperatively interact with the component, inject data, and query its capabilities.
 *
 * @param schema The introspection metadata and imperative methods.
 */
export function useIntrospection(schema: IntrospectionSchema) {
  useEffect(() => {
    const registry = getIntrospectionRegistry();
    
    // Register when mounted
    registry.register(schema);

    // Unregister when unmounted
    return () => {
      registry.unregister(schema.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.id]); // Re-run only if the ID changes, keeping the registry stable
}
