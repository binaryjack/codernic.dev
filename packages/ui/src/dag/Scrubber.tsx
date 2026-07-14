import React from 'react';
import { Button } from '../atoms/button';
import { Text } from '../atoms/text';
import { Badge } from '../atoms/badge';
import { IconPlay, IconStop, IconArrowLeft, IconArrowRight } from '../atoms/icons';
import { useTestId } from '../hooks/useTestId';

export interface TimelineSnapshot {
    sequence: number;
    timestamp: string;
    eventType: string;
    stateJson: string;
}

export interface ScrubberProps {
    snapshots: TimelineSnapshot[];
    currentSequence: number;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onSeek: (sequence: number) => void;
}

export const Scrubber: React.FC<ScrubberProps & { dataTestId?: string }> = ({ dataTestId,
    snapshots,
    currentSequence,
    isPlaying,
    onPlay,
    onPause,
    onSeek
}) => {
    
  const { rootId, getTestId } = useTestId('scrubber', dataTestId);
const minSeq = snapshots.length > 0 ? snapshots[0].sequence : 0;
    const maxSeq = snapshots.length > 0 ? snapshots[snapshots.length - 1].sequence : 0;
    
    const currentIndex = snapshots.findIndex(s => s.sequence === currentSequence);
    const progress = snapshots.length > 1 ? (currentIndex / (snapshots.length - 1)) * 100 : 0;

    return (
        <div className="flex flex-col gap-4 w-full p-4 bg-slate-900 rounded-lg border border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-2">
                <Text data-testid={getTestId('text')} className="text-slate-300 font-semibold tracking-wide">
                    Time-Traveling Visual Debugger
                </Text>
                <Badge data-testid={getTestId('badge')} label={`Seq: ${currentSequence} / ${maxSeq}`} />
            </div>
            
            <div className="relative h-6 flex items-center cursor-pointer group" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                const targetIndex = Math.round(ratio * (snapshots.length - 1));
                if (snapshots[targetIndex]) {
                    onSeek(snapshots[targetIndex].sequence);
                }
            }}>
                {/* Track Background */}
                <div className="absolute w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    {/* Track Fill */}
                    <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                {/* Thumb */}
                <div 
                    className="absolute w-4 h-4 bg-white rounded-full shadow-md border-2 border-blue-500 transition-all duration-300 ease-out transform -translate-x-1/2 hover:scale-125"
                    style={{ left: `${progress}%` }}
                />
            </div>
            
            <div className="flex justify-center gap-3 mt-2">
                <Button data-testid={getTestId('button')} 
                    variant="secondary" 
                    onClick={() => {
                        const newIdx = Math.max(0, currentIndex - 1);
                        if(snapshots[newIdx]) onSeek(snapshots[newIdx].sequence);
                    }}
                    disabled={currentIndex <= 0}
                >
                    <IconArrowLeft data-testid={getTestId('icon-arrow-left')} size={16} />
                </Button>
                
                {isPlaying ? (
                    <Button data-testid={getTestId('button-1')} variant="primary" onClick={onPause}>
                        <IconStop data-testid={getTestId('icon-stop')} size={16} />
                    </Button>
                ) : (
                    <Button data-testid={getTestId('button-2')} variant="primary" onClick={onPlay} disabled={currentIndex >= snapshots.length - 1}>
                        <IconPlay data-testid={getTestId('icon-play')} size={16} />
                    </Button>
                )}
                
                <Button data-testid={getTestId('button-3')} 
                    variant="secondary" 
                    onClick={() => {
                        const newIdx = Math.min(snapshots.length - 1, currentIndex + 1);
                        if(snapshots[newIdx]) onSeek(snapshots[newIdx].sequence);
                    }}
                    disabled={currentIndex >= snapshots.length - 1}
                >
                    <IconArrowRight data-testid={getTestId('icon-arrow-right')} size={16} />
                </Button>
            </div>
        </div>
    );
};
