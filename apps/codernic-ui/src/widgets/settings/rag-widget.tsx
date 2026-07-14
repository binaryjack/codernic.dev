import React from 'react';
import { motion } from 'framer-motion';
import { IconDatabase, IconPlus, IconSettings } from '@ai-agencee/ui';
import { Button } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

export function RagWidget() {
  
  const { rootId, getTestId } = useTestId('rag-widget', undefined);
return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full bg-[#09090b] flex flex-col overflow-hidden p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <IconDatabase data-testid={getTestId('icon-database')} size={20} className="text-amber-500" />
            Vector Databases
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Configure RAG endpoints and embedding models.</p>
        </div>
        <Button data-testid={getTestId('button')} variant="primary" className="flex items-center gap-2">
          <IconPlus data-testid={getTestId('icon-plus')} size={16} />
          Add Connection
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg p-8">
          <IconSettings data-testid={getTestId('icon-settings')} size={32} className="mb-4 opacity-50" />
          <p className="text-sm">No Vector Databases configured yet.</p>
          <p className="text-xs mt-2 opacity-75">Connect ChromaDB, Qdrant, or Pinecone to enable Retrieval-Augmented Generation.</p>
        </div>
      </div>
    </motion.div>
  );
}
