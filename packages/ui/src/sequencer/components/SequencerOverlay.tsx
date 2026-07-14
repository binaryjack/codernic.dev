import React, { useEffect, useState, useRef } from 'react';
import { useSequencer } from './SequencerProvider';
import { SequencerTooltip } from './SequencerTooltip';
import { SequencerTransportBar } from './SequencerTransportBar';
import { DOMWaiter } from '../../introspection/core/DOMWaiter';
import { useTestId } from '../../hooks/useTestId';

export function SequencerOverlay() {
  
  const { rootId, getTestId } = useTestId('sequencer-overlay');
  const { machine, chain, currentStep, status, isAutoPlay } = useSequencer();
  const [targetRects, setTargetRects] = useState<DOMRect[]>([]);
  const [finishedStepId, setFinishedStepId] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  const [targetElements, setTargetElements] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (status !== 'RUNNING' && status !== 'PAUSED') {
      setTargetRects([]);
      setTargetElements([]);
      setFinishedStepId(null);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
      return;
    }

    if (status === 'PAUSED' || !currentStep) return;

    let isCancelled = false;

    const findAndHighlight = async () => {
      let els: HTMLElement[] = [];
      const targets = Array.isArray(currentStep.target) ? currentStep.target : [currentStep.target];
      const selectors = targets.map(t => {
        if (t === 'body' || t === 'html' || t.startsWith('.') || t.startsWith('#') || t.startsWith('[')) {
          return t;
        }
        // Match exact, or matching suffix (e.g. chat-widget-chat-input matches chat-input)
        return `[data-testid="${t}"], [data-testid$="-${t}"]`;
      });

      try {
        els = await DOMWaiter.waitForElements(selectors, (currentStep.action === 'introspection' || currentStep.action === 'injectData') ? 1000 : 5000);
      } catch (e: unknown) {
        if (isCancelled) return;
        if (currentStep.action === 'introspection' || currentStep.action === 'injectData') {
          console.log(`[SequencerOverlay] Target [data-testid="${currentStep.target}"] not found, but this is an ${currentStep.action} step. Falling back to document.body.`);
          els = [document.body];
        } else {
          // It's a visual step and we failed to find elements - throw a critical error!
          import('../core/SequencerLogger').then(({ SequencerLogger }) => {
            if (isCancelled) return;
            SequencerLogger.critical(currentStep, `Failed to find target elements: ${selectors.join(', ')} within timeout.`);
          });
        }
      }
      
      if (isCancelled) return;

      if (els.length > 0) {
        console.log(`[SequencerOverlay] Found target elements for step: ${currentStep.id || currentStep.action}`);
        
        if (currentStep.action !== 'introspection') {
          setTargetElements(els);
        }

        // Small pause to allow UI transition
        await new Promise(r => setTimeout(r, 100)); 

        // Execute on the first element
        const result = await chain.executeStep(currentStep, els[0]);
        
        if (isCancelled) {
          if (result.cleanup) result.cleanup();
          return;
        }

        console.log(`[SequencerOverlay] Finished step: ${currentStep.id || currentStep.action}`);
        setFinishedStepId(currentStep.id || null);
        cleanupRef.current = result.cleanup;

        return () => {
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = undefined;
          }
        };
      } else {
        machine.stop();
      }
    };

    console.log(`[SequencerOverlay] Starting step: ${currentStep.id || currentStep.action}`);
    const cleanupPromise = findAndHighlight();

    return () => {
      isCancelled = true;
      cleanupPromise.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
      });
    };
  }, [currentStep, status, chain, machine]);

  // Handle Resize & Scroll Listeners Synchronously with ResizeObserver and polling
  useEffect(() => {
    if (targetElements.length === 0) return;
    
    let animationFrameId: number;
    let pollInterval: NodeJS.Timeout;

    const updateRect = () => {
      const rects = targetElements.map(el => el.getBoundingClientRect());
      setTargetRects(rects);
    };

    updateRect(); // Initial call
    
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateRect);
    });

    targetElements.forEach(el => {
      ro.observe(el);
      if (el.parentElement) ro.observe(el.parentElement);
    });
    
    ro.observe(document.body);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    // Reassurance loop to track CSS transitions
    pollInterval = setInterval(updateRect, 50);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animationFrameId);
      clearInterval(pollInterval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [targetElements]);

  // Auto-play or Auto-advance timer effect
  useEffect(() => {
    if (status === 'RUNNING' && currentStep && finishedStepId === currentStep.id) {
      if (currentStep.autoAdvance) {
        machine.next();
      } else if (isAutoPlay) {
        const timer = setTimeout(() => {
          machine.next();
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [isAutoPlay, status, finishedStepId, machine, currentStep]);

  if (status !== 'RUNNING' && status !== 'PAUSED') return null;

  let highlightOverlay = null;

  if (currentStep && targetRects.length > 0) {
    const padding = 8;
    
    // Create padded rects for the SVG mask
    const paddedRects = targetRects.map(rect => ({
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      rx: 12 // border radius
    }));

    // Tooltip positioning logic (based on the first highlighted element)
    const firstRect = paddedRects[0];
    const tooltipWidth = 450;
    const tooltipHeight = 220; 
    
    let tooltipTop = firstRect.y + firstRect.height + 16;
    if (tooltipTop + tooltipHeight > window.innerHeight) {
      tooltipTop = firstRect.y - tooltipHeight - 16;
    }
    // Clamp top position within screen boundaries
    tooltipTop = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, tooltipTop));

    // Clamp left position within screen boundaries
    let tooltipLeft = firstRect.x + (firstRect.width / 2) - (tooltipWidth / 2);
    tooltipLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, tooltipLeft));

    // Get fallback content from the first element if available
    const fallbackDesc = targetElements[0]?.getAttribute('data-demo-desc') || undefined;

    highlightOverlay = (
      <>
        {/* SVG Mask Background */}
        <svg 
          width="100%"
          height="100%"
          className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-500 ease-out" 
          style={{ zIndex: 1 }}
        >
          <defs>
            <mask id="sequencer-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {paddedRects.map((rect, idx) => (
                <rect key={idx} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={rect.rx} fill="black" />
              ))}
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="#000000" fillOpacity={0.65} mask="url(#sequencer-mask)" />
          
          {/* Amber borders inside the cutouts */}
          {paddedRects.map((rect, idx) => (
            <rect 
              key={`border-${idx}`} 
              x={rect.x} 
              y={rect.y} 
              width={rect.width} 
              height={rect.height} 
              rx={rect.rx} 
              fill="none" 
              stroke="#f59e0b" 
              strokeOpacity={0.4}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
          ))}
        </svg>
        
        {/* Tooltip Wrapper */}
        <div 
          className={`absolute pointer-events-auto transition-all duration-500 ease-out ${status === 'PAUSED' ? 'opacity-50' : 'opacity-100'}`}
          style={{
            top: tooltipTop,
            left: tooltipLeft,
            zIndex: 2
          }}
        >
          <SequencerTooltip data-testid={getTestId('sequencer-tooltip')} 
            step={currentStep} 
            fallbackContent={fallbackDesc}
            onNext={() => machine.next()} 
            onSkip={() => machine.stop()} 
          />
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-300">
      <div className="absolute inset-0 pointer-events-auto z-[-1]" />
      {highlightOverlay}
      <div className="relative z-[10]">
        <SequencerTransportBar data-testid={getTestId('sequencer-transport-bar')} />
      </div>
    </div>
  );
}
