import React, { useMemo, useEffect } from 'react';

export interface AgnosticDropdownSource {
  type: 'json' | 'files' | 'store';
  fileName?: string;
  collectionPath?: string;
  path?: string;
  valueField?: string;
  labelField?: string;
}

export interface AgnosticDropdownProps {
  value: string;
  onChange: (value: string) => void;
  // Dynamic sources
  sources?: AgnosticDropdownSource[];
  rootValue?: any;
  // Legacy DropDown schema support
  fieldSchema?: any;
  parentValue?: any;
  
  assets?: Record<string, any>;
  metadataSources?: Record<string, any>;
  placeholder?: string;
  onRequestAsset?: (type: string, id: string) => void;
}

const getNested = (obj: any, path: string) => {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function AgnosticDropdown({
  value,
  onChange,
  sources = [],
  rootValue = {},
  fieldSchema,
  parentValue,
  assets = {},
  metadataSources = {},
  placeholder = 'Select...',
  onRequestAsset
}: AgnosticDropdownProps) {

  // Handle legacy DropDown fetches
  useEffect(() => {
    if (fieldSchema && fieldSchema.type === 'DropDown' && fieldSchema.sourceFile) {
      const sourceId = fieldSchema.sourceFile.replace('.json', '');
      const sourceData = metadataSources[sourceId] || metadataSources[fieldSchema.sourceFile];
      if (!sourceData && fieldSchema.sourceAssetType && fieldSchema.sourceAssetId) {
        onRequestAsset?.(fieldSchema.sourceAssetType, fieldSchema.sourceAssetId);
      }
    }
  }, [fieldSchema, metadataSources, onRequestAsset]);

  const options = useMemo(() => {
    let allOptions: any[] = [];

    // Legacy DropDown behavior
    if (fieldSchema && fieldSchema.type === 'DropDown' && fieldSchema.sourceFile) {
      const sourceId = fieldSchema.sourceFile.replace('.json', '');
      const sourceData = metadataSources[sourceId] || metadataSources[fieldSchema.sourceFile];
      if (sourceData) {
        let collection = Array.isArray(sourceData) ? sourceData : sourceData[fieldSchema.sourceCollection || ''] || [];
        if (fieldSchema.behavior === 'cascading' && fieldSchema.dependsOn) {
          const parentVal = parentValue?.[fieldSchema.dependsOn];
          if (parentVal) {
            if (fieldSchema.dependsOnType === 'field') {
              collection = collection.filter((item: any) => item[fieldSchema.fromField || ''] === parentVal);
            } else {
              const parentObj = collection.find((item: any) => item[fieldSchema.fromField || ''] === parentVal);
              collection = parentObj ? parentObj[fieldSchema.sourceCollection || ''] || [] : [];
            }
          } else {
            collection = []; // Missing parent
          }
        }
        allOptions = allOptions.concat(
          (Array.isArray(collection) ? collection : []).map((item: any) => ({
            value: item[fieldSchema.valueField || 'id'],
            label: item[fieldSchema.labelField || 'name']
          }))
        );
      }
    }

    // New Dynamic sources behavior
    for (const src of sources) {
      if (src.type === 'json' && src.fileName === '[thisFile]') {
        const collection = getNested(rootValue, src.collectionPath || '') || [];
        if (Array.isArray(collection)) {
          allOptions = allOptions.concat(collection.map((item: any) => ({
            value: item[src.valueField || 'id'] || item,
            label: item[src.labelField || src.valueField || 'name'] || item
          })));
        }
      } else if (src.type === 'files') {
        let domain: string | null = null;
        if (src.path?.includes('/agents/')) domain = 'agents';
        else if (src.path?.includes('/dags/')) domain = 'dags';
        else if (src.path?.includes('/rules/')) domain = 'rules';
        else if (src.path?.includes('/config/llms/')) domain = 'llmRoutes';

        if (domain && assets[domain]) {
          const dict = assets[domain];
          allOptions = allOptions.concat(Object.values(dict).map((item: any) => ({
            value: item[src.valueField || 'id'],
            label: item[src.labelField || src.valueField || 'name']
          })));
        }
      } else if (src.type === 'store') {
        if (src.path && assets[src.path]) {
          const collection = Array.isArray(assets[src.path]) ? assets[src.path] : Object.values(assets[src.path]);
          allOptions = allOptions.concat(collection.map((item: any) => ({
            value: item[src.valueField || 'id'],
            label: item[src.labelField || src.valueField || 'name'] || item[src.valueField || 'id']
          })));
        }
      }
    }

    const uniqueOptions: any[] = [];
    const seen = new Set();
    for (const opt of allOptions) {
      if (opt && opt.value && !seen.has(opt.value)) {
        seen.add(opt.value);
        uniqueOptions.push(opt);
      }
    }

    uniqueOptions.sort((a, b) => {
      const lA = String(a.label || '');
      const lB = String(b.label || '');
      return lA.localeCompare(lB);
    });

    return uniqueOptions;
  }, [sources, rootValue, fieldSchema, parentValue, assets, metadataSources]);

  // Loading state detection
  const isLoading = fieldSchema && fieldSchema.type === 'DropDown' && fieldSchema.sourceFile && !options.length && 
    !(metadataSources[fieldSchema.sourceFile.replace('.json', '')] || metadataSources[fieldSchema.sourceFile]);

  if (isLoading) {
    return <span className="text-xs text-blue-400">Loading {fieldSchema.sourceFile}...</span>;
  }

  // Cascading missing state detection
  if (fieldSchema && fieldSchema.behavior === 'cascading' && fieldSchema.dependsOn && !parentValue?.[fieldSchema.dependsOn]) {
    return <span className="text-xs text-orange-400">Select {fieldSchema.dependsOn} first</span>;
  }

  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full text-xs p-1 rounded outline-none focus:border-[var(--vscode-focusBorder)]"
      style={{
        backgroundColor: 'var(--vscode-dropdown-background)',
        color: 'var(--vscode-dropdown-foreground)',
        border: '1px solid var(--vscode-dropdown-border)'
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
