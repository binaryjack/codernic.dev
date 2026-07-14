import { useState } from 'react';
import { IconThought, IconZap, IconLayers } from '@ai-agencee/ui';
import { Button } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

interface OnboardingHeroProps {
  onDismiss: () => void;
  dataTestId?: string;
}

export function OnboardingHero({ dataTestId, onDismiss }: OnboardingHeroProps) {
  
  const { rootId, getTestId } = useTestId('onboarding-hero', dataTestId);
const [dontShow, setDontShow] = useState(false);

  const handleDismiss = () => {
    if (dontShow) {
      localStorage.setItem('codernic_hide_onboarding', 'true');
    }
    onDismiss();
  };

  return (
    <div className="flex flex-col items-center justify-center pt-12 pb-10 w-full max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700 relative z-10">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 206 206.9" width={48} height={48} className="mb-6 opacity-80" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' }}>
        <path fill="var(--amber-500)" d="M206,47.7c-6.8,0.3-13.7,0-20.5,0.5c-4.4,0.3-6.3-1.7-8.1-5.1c-3.2-6-6.7-11.8-10.3-17.5 c-0.8-1.2-2.7-2.4-4.1-2.4c-29-0.1-58-0.2-87,0c-1.7,0-4.1,1.8-5.1,3.4C57.3,49.8,43.8,73.1,30.3,96.4 c-1.2,2.1-2.4,4.2-3.4,6.4c-0.2,0.5,0,1.3,0.2,1.8c5.2,8.9,10.5,17.8,15.6,26.7c7,12.2,13.8,24.4,20.7,36.6 c2.5,4.5,4.9,9.1,7.8,13.4c1,1.4,3.4,2.5,5.3,2.6c5.6,0.3,11.3,0.1,17,0.2c1.4,0,3.5,0.2,4,1.1 c4,6.9,7.8,14,11.6,21.5c-16,0.4-32,0.4-48.6,0c-4.7-7.4-8.8-14.5-12.9-21.6c-9.6-16.6-19.1-33.2-28.8-49.7 C12.6,124.8,6.2,114.4,0,104c0,0,0-0.5,0.3-0.8c1.4-2.1,2.5-3.9,3.6-5.7C12.1,83,20.1,68.5,28.4,54.2 C38.8,36.1,49.5,18.1,60,0c39.4,0,78.7,0,118.6,0.3c3.2,4.9,5.8,9.5,8.5,14c6.3,10.6,12.6,21.1,18.9,31.6 C206,46.4,206,46.9,206,47.7z" />
        <path fill="var(--amber-500)" d="M168.8,46.2c4.2,7.1,8.3,13.9,12.1,20.8c0.6,1.2,0.7,3.3,0.1,4.4 c-14.9,25.8-29.9,51.5-44.8,77.3c-3.9,6.7-7.5,13.6-11.6,20.1c-1,1.6-3.5,3-5.3,3.1 c-13.2,0.3-26.3,0.2-39.5,0c-1.6,0-4-1-4.8-2.3c-3.8-6.1-7.2-12.5-11.3-19.6 c3.5,0,6.3,0,9.2,0c10.8,0,21.7-0.1,32.5,0c2.7,0,4.3-0.6,5.8-3.2 c13.4-23.5,26.7-46.9,40.7-70c3.5-5.8,3.5-9.6-0.3-15.1c-5.5-8.1-9.8-17.1-15.1-26.6 c8.9,0,16.9-0.2,24.9,0.2c1.3,0.1,2.5,2.6,3.5,4.2C166.2,41.5,167.3,43.8,168.8,46.2z" />
        <path fill="var(--amber-500)" d="M50.3,97.3C62,77,73.4,57,85.1,37.1c0.9-1.6,3.5-2.9,5.4-3c9.3-0.3,18.7-0.3,28,0 c1.8,0.1,4.1,1.6,5.1,3.2c2.7,3.9,4.8,8.2,7.3,12.7c-10.2,0-19.8,0.2-29.5-0.1c-3.1-0.1-4.9,1.1-6.2,3.5 C86,69.6,77.1,86.1,67.3,102c-3.9,6.3-4.1,10.8,0.4,16.7c3.9,5,6.4,11.1,9.9,17.4 c-6.4,0-12,0.2-17.5-0.1c-1.4-0.1-3.1-1.6-4-2.9c-4.1-6.7-8.1-13.6-11.9-20.5 c-0.7-1.3-0.4-3.7,0.3-5.2C46,103.9,48.2,100.8,50.3,97.3z" />
      </svg>
      
      <h2 className="text-2xl font-bold mb-2 text-white">Welcome to Codernic</h2>
      <p className="text-zinc-400 max-w-md text-center text-sm mb-10">
        Your autonomous AI engineering partner. Let's explore the core capabilities to get you started rapidly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-10">
        <div className="flex flex-col p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/40 hover:bg-zinc-800/30 hover:border-zinc-700/50 transition-all backdrop-blur-sm" data-testid="onboarding-card-multimodal">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <IconZap data-testid={getTestId('icon-zap')} size={18} className="text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-2">Multi-Modal Intelligence</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Switch seamlessly between Ask (Q&A), Plan (Architecture), and Agent (Execution) modes directly from the prompt bar.
          </p>
        </div>

        <div className="flex flex-col p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/40 hover:bg-zinc-800/30 hover:border-zinc-700/50 transition-all backdrop-blur-sm" data-testid="onboarding-card-introspection">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <IconThought data-testid={getTestId('icon-thought')} size={18} className="text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-2">Deep Introspection</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Watch reasoning models "think" in real-time via the Introspection Panel, and inspect Erathos DAG execution graphs.
          </p>
        </div>

        <div className="flex flex-col p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/40 hover:bg-zinc-800/30 hover:border-zinc-700/50 transition-all backdrop-blur-sm" data-testid="onboarding-card-context">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <IconLayers data-testid={getTestId('icon-layers')} size={18} className="text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-2">Infinite Local Context</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Codernic indexes your entire codebase securely. Use RAG to query across thousands of files without blowing up your token limit.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full justify-between px-2 pt-4 border-t border-zinc-800/50">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900/50 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
          />
          <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
            Don't display this welcome screen anymore
          </span>
        </label>
        
        <div className="flex items-center gap-3">
          <Button data-testid={getTestId('button')} 
            variant="primary"
            onClick={() => {
              localStorage.setItem('FORCE_DEMO_MODE', 'true');
              window.location.reload();
            }}
            className="!px-6 !py-2.5 !text-xs !font-bold text-amber-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2"
          >
            🚀 View Interactive Demos
          </Button>
          
          <Button data-testid={getTestId('button-1')} 
            variant="secondary"
            onClick={handleDismiss}
            className="!px-6 !py-2.5 !text-xs !font-bold text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-all border-none"
          >
            Let's Build
          </Button>
        </div>
      </div>
    </div>
  );
}
