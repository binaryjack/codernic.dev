import { logger } from '../lib/logger';

// Anti-spam registry to only log an ID once per application lifecycle
const registeredIds = new Set<string>();

export function useTestId(componentName: string, parentId?: string) {
  // rootId is the parent's ID if provided, otherwise the default component name
  const rootId = parentId || componentName;

  if (!registeredIds.has(rootId)) {
    logger.info(`[TestID Root] ${rootId}`);
    registeredIds.add(rootId);
  }

  // Utility function to generate child IDs cleanly
  const getTestId = (elementName: string, collectionId?: string | number) => {
    const id = collectionId !== undefined 
      ? `${rootId}-${elementName}-${collectionId}`
      : `${rootId}-${elementName}`;
      
    if (!registeredIds.has(id)) {
      logger.info(`[TestID Child] ${id}`);
      registeredIds.add(id);
    }
    
    return id;
  };

  return { rootId, getTestId };
}
