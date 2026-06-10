import { useEffect, useState } from 'react';

export function PropertiesPanel() {
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Example hook: Adjust according to your redux state implementation
  // const selectedNode = useSelector((state: RootState) => state.kernel.selectedNode);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Mocking the call structure based on Rust atomos_templates.rs
        // This will be replaced with the actual MCP client call in full E2E
        console.log("Fetching MCP node templates...");
        
        // Use setTemplates to avoid unused variable warning (mock behavior)
        setTemplates({
          "mock-node": { type: "object" }
        });

        // const res = await callMcpTool('atomos-structura/get-node-templates', {});
        // if (res.success) {
        //   setTemplates(res.templates);
        // }
      } catch (err) {
        console.error('Failed to load node templates:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);

  return (
    <div className="flex flex-col h-full w-full space-y-6">
      <section className="flex flex-col space-y-2">
        <h3 className="text-sm font-semibold text-[var(--vscode-editor-foreground)] uppercase tracking-wider">
          Node Properties
        </h3>
        
        {isLoading ? (
          <div className="text-xs text-[var(--vscode-descriptionForeground)] italic">
            Loading templates...
          </div>
        ) : (
          <div className="text-xs text-[var(--vscode-descriptionForeground)]">
            <p>Templates loaded: {Object.keys(templates).length}</p>
            {/* Dynamic Form will be rendered here based on JSON schema templates */}
          </div>
        )}
      </section>
    </div>
  );
}
