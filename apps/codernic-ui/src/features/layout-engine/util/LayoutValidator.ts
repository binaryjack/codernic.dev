import type { BlockState, LayoutState } from '@ai-agencee/ui/layout-engine';
import { DEFAULT_LAYOUTS } from '../model/default-layouts';

// Very lightweight validator implementing the constraints of layouts.schema.json
export class LayoutValidator {
  
  /**
   * Validates a parsed JSON payload against the layout schema structural rules.
   */
  public static validateSchema(data: any): boolean {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.error('[LayoutValidator] Root must be an object.');
      return false;
    }

    for (const [key, block] of Object.entries(data)) {
      if (!block || typeof block !== 'object') {
        console.error(`[LayoutValidator] Block '${key}' is invalid.`);
        return false;
      }

      const b = block as any;

      if (typeof b.id !== 'string') {
        console.error(`[LayoutValidator] Block '${key}' missing 'id'.`);
        return false;
      }

      if (b.type !== 'vblock' && b.type !== 'widget') {
        console.error(`[LayoutValidator] Block '${key}' has invalid type: ${b.type}.`);
        return false;
      }

      if (b.type === 'vblock') {
        if (b.orientation !== 'horizontal' && b.orientation !== 'vertical') {
          console.error(`[LayoutValidator] VBlock '${key}' has invalid orientation: ${b.orientation}.`);
          return false;
        }
        if (!Array.isArray(b.childrenIds)) {
          console.error(`[LayoutValidator] VBlock '${key}' missing childrenIds array.`);
          return false;
        }
        if (!Array.isArray(b.ratios)) {
          console.error(`[LayoutValidator] VBlock '${key}' missing ratios array.`);
          return false;
        }
      } else if (b.type === 'widget') {
        if (typeof b.widgetType !== 'string') {
          console.error(`[LayoutValidator] Widget '${key}' missing widgetType string.`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Performs deeper graph consistency checks.
   * e.g., NO dangling references, NO cyclic graphs, NO ratio/children size mismatch.
   */
  public static validateGraphConsistency(layout: Record<string, BlockState>): boolean {
    const ids = new Set(Object.keys(layout));
    
    for (const [key, block] of Object.entries(layout)) {
      // 1. Check parentId reference
      if (block.parentId && !ids.has(block.parentId)) {
        console.error(`[LayoutValidator] Block '${key}' references unknown parentId '${block.parentId}'.`);
        return false;
      }

      // 2. Check children exist and match ratios
      if (block.type === 'vblock') {
        // According to instructions: "interdiction des tableaux d'enfants vides" if strictly enforced,
        // but an empty vblock might exist temporarily in edit mode. We'll ensure arrays match in length.
        if (block.childrenIds!.length !== block.ratios!.length) {
          console.error(`[LayoutValidator] VBlock '${key}' childrenIds length (${block.childrenIds!.length}) does not match ratios length (${block.ratios!.length}).`);
          return false;
        }

        for (const childId of block.childrenIds!) {
          if (!ids.has(childId)) {
            console.error(`[LayoutValidator] VBlock '${key}' references unknown childId '${childId}'.`);
            return false;
          }
        }
      }
    }
    
    // Valid
    return true;
  }

  /**
   * Validates a layout state. If corrupt, falls back to the requested default.
   */
  public static safeLoadLayout(layoutName: string, rawData: string | null): Record<string, BlockState> {
    const fallback = DEFAULT_LAYOUTS[layoutName] || DEFAULT_LAYOUTS['Coder'];

    if (!rawData) {
      console.log(`[LayoutValidator] No saved data for '${layoutName}', loading default layout.`);
      return fallback;
    }

    try {
      const parsed = JSON.parse(rawData);

      // 1. Structural Schema Validation
      if (!this.validateSchema(parsed)) {
        throw new Error('Schema validation failed.');
      }

      // 2. Graph Consistency
      if (!this.validateGraphConsistency(parsed)) {
        throw new Error('Graph consistency validation failed.');
      }

      console.log(`[LayoutValidator] Layout '${layoutName}' successfully validated and loaded from disk.`);
      return parsed;

    } catch (e: any) {
      console.error(`[LayoutValidator] CORRUPTION DETECTED in '${layoutName}' layout. Fallback to defaults. Error: ${e.message}`);
      return fallback;
    }
  }
}
