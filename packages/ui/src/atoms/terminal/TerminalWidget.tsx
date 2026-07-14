import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalWidgetProps {
  onData: (data: string) => void;
  className?: string;
  theme?: Record<string, string>;
}

export interface TerminalRef {
  write: (data: string) => void;
  clear: () => void;
}

export const TerminalWidget = React.forwardRef<TerminalRef, TerminalWidgetProps>(
  ({ onData, className, theme }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);

    useEffect(() => {
      if (!terminalRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        theme: theme || {
          background: '#18181b', // zinc-900
          foreground: '#e4e4e7', // zinc-200
        },
        fontFamily: '"Fira Code", monospace',
        fontSize: 14,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      term.onData((data) => {
        onData(data);
      });

      const handleResize = () => {
        fitAddon.fit();
      };

      window.addEventListener('resize', handleResize);
      xtermRef.current = term;

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    }, []); // Only run once on mount

    React.useImperativeHandle(ref, () => ({
      write: (data: string) => {
        xtermRef.current?.write(data);
      },
      clear: () => {
        xtermRef.current?.clear();
      }
    }));

    return (
      <div 
        ref={terminalRef} 
        className={`w-full h-full overflow-hidden ${className || ''}`}
        style={{ minHeight: '300px' }}
      />
    );
  }
);
TerminalWidget.displayName = 'TerminalWidget';
