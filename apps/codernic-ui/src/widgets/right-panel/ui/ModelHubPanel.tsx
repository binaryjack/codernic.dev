import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { sendIntent } from '../../../entities/kernel';
import { Button } from '../../../shared';

export interface HuggingFaceModel {
  id: string;
  downloads: number;
  likes: number;
  gguf_files: string[];
}

export function ModelHubPanel() {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'codernic:hfs-result') {
        setModels(e.data.payload.models || []);
        setIsSearching(false);
      } else if (e.data.type === 'codernic:hfs-error') {
        setError(e.data.payload);
        setIsSearching(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    setModels([]);
    dispatch(sendIntent({ type: 'codernic:hfs', payload: { query, match: 'c', type: 'gguf' } }));
  };

  const handleDownload = (modelId: string, file: string) => {
    // For now, we can just send an intent that the backend or CLI can pick up
    // Or we can just log it since hfd command isn't fully wired yet
    console.log(`Downloading ${modelId}/${file}...`);
    dispatch(sendIntent({ type: 'codernic:hfd', payload: { name: `${modelId}/${file}` } }));
  };

  return (
    <div className="flex flex-col h-full w-full space-y-4">
      <section className="flex flex-col space-y-2">
        <h3 className="text-sm font-semibold text-[var(--vscode-editor-foreground)] uppercase tracking-wider">
          HuggingFace Hub
        </h3>
        <p className="text-xs text-[var(--vscode-descriptionForeground)] mb-2">
          Search and download GGUF models directly.
        </p>
        <div className="flex space-x-2">
          <input 
            value={query} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} 
            placeholder="Search models... (e.g. qwen)"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') handleSearch();
            }}
            className="flex-1 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] px-2 py-1 text-sm outline-none focus:border-[var(--vscode-focusBorder)]"
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? '...' : 'Search'}
          </Button>
        </div>
      </section>

      <section className="flex-1 overflow-y-auto pr-2 space-y-3">
        {error && (
          <div className="text-xs text-red-400 p-2 bg-red-900/20 border border-red-700/50 rounded">
            Error: {error}
          </div>
        )}

        {models.map((model) => (
          <div key={model.id} className="flex flex-col space-y-2 bg-[var(--vscode-editor-inactiveSelectionBackground)] p-3 rounded-md border border-[var(--vscode-widget-border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-blue-400 break-all">{model.id}</span>
              <div className="flex items-center space-x-3 text-xs text-[var(--vscode-descriptionForeground)]">
                <span>⬇️ {model.downloads.toLocaleString()}</span>
                <span>❤️ {model.likes.toLocaleString()}</span>
              </div>
            </div>

            {model.gguf_files.length === 0 ? (
              <span className="text-xs text-[var(--vscode-descriptionForeground)] italic">No GGUF files found</span>
            ) : (
              <div className="flex flex-col space-y-1 mt-2 border-t border-[var(--vscode-widget-border)] pt-2">
                {model.gguf_files.map(file => (
                  <div key={file} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--vscode-editor-foreground)] font-mono truncate mr-2" title={file}>
                      {file}
                    </span>
                    <Button variant="secondary" size="xs" onClick={() => handleDownload(model.id, file)}>
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {!isSearching && models.length === 0 && !error && query && (
          <div className="text-xs text-[var(--vscode-descriptionForeground)] italic">
            No models found. Try a different query.
          </div>
        )}
      </section>
    </div>
  );
}
