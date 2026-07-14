const fs = require('fs');
const path = require('path');

function replaceStateAny(filePath, rootStateImportPath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('(state: any)')) return;
    content = content.replace(/\(state: any\)/g, '(state: RootState)');
    
    // Add import if not present
    if (!content.includes('import { RootState }') && !content.includes('import type { RootState }')) {
        content = `import type { RootState } from '${rootStateImportPath}';\n` + content;
    }
    
    fs.writeFileSync(filePath, content);
}

replaceStateAny('src/app/App.tsx', './store');
replaceStateAny('src/components/layout/StatusBarFooter.tsx', '../../store');
replaceStateAny('src/entities/app/model/app-slice.ts', '../../../store');
replaceStateAny('src/entities/introspection/model/introspection-slice.ts', '../../../store');
replaceStateAny('src/features/analyse/widget/analyse.widget.tsx', '../../../store');
replaceStateAny('src/features/chat/widget/chat.widget.tsx', '../../../store');
replaceStateAny('src/features/json-editor/components/json-editor/JsonDynamicDropdownEditor.tsx', '../../../../store');
replaceStateAny('src/features/system/hooks/useSystemMetrics.ts', '../../../store');
replaceStateAny('src/widgets/dag-pipeline/ui/dag-node-card.tsx', '../../../store');
replaceStateAny('src/widgets/right-panel/ui/AnalyzerPanel.tsx', '../../../store');

console.log("Done!");
