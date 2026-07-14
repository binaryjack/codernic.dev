import { useState } from 'react';
import { Button, Heading, Text } from '@ai-agencee/ui';
import { getCodernicHttpUrl } from '../../../shared/config';
import { useTestId } from '@ai-agencee/ui';

export function VisionManagerWidget({ dataTestId }: { dataTestId?: string } = {}) {
  const { getTestId } = useTestId('vision-manager-widget');
  
  const rootId = dataTestId || 'vision-manager-widget';
  const [url, setUrl] = useState('https://news.ycombinator.com/');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; base64?: string; error?: string } | null>(null);

  const handleCapture = async () => {
    setLoading(true);
    setResult(null);

    try {
      const HTTP_URL = getCodernicHttpUrl();
          
      const response = await fetch(`${HTTP_URL}/api/vision/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (e: unknown) {
      setResult({ success: false, error: (e instanceof Error ? e.message : String(e)) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3" data-testid={rootId}>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="Enter URL to capture..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
          disabled={loading}
          data-testid={getTestId('url-input')}
        />
        <Button data-testid={getTestId('button')} 
          variant="primary" 
          onClick={handleCapture}
          disabled={loading || !url}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Capturing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Test Capture
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className={`p-4 mt-2 rounded-md border ${result.success ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`} data-testid={getTestId('result')}>
          <div className={`font-semibold mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
            {result.success ? 'Capture Successful' : 'Capture Failed'}
          </div>
          
          {result.success && result.base64 ? (
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase font-medium">Rendered Output (Scaled Down)</span>
              <img 
                src={`data:image/png;base64,${result.base64}`} 
                alt="Vision microservice capture" 
                className="max-w-full h-auto rounded border border-zinc-700 shadow-lg object-contain max-h-[400px] w-full bg-black/50" 
                data-testid={getTestId('preview-image')}
              />
            </div>
          ) : (
            <div className="text-sm text-red-300 font-mono" data-testid={getTestId('error')}>
              {result.error || 'Unknown error occurred during capture.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
