import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {
  selectArtifactReview,
  resolveArtifactReview,
} from '../../entities/kernel/model/kernel-slice';

export const ArtifactModal: React.FC = () => {
  const dispatch = useDispatch();
  const artifactReview = useSelector(selectArtifactReview);
  
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    if (artifactReview && artifactReview.filename) {
      setLoading(true);
      const url = `${import.meta.env.VITE_CODERNIC_URL?.replace('ws://', 'http://') || 'http://localhost:47321'}/api/artifacts/${artifactReview.filename}`;
      fetch(url)
        .then(res => res.text())
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load artifact', err);
          setContent(`Failed to load artifact: ${err}`);
          setLoading(false);
        });
    }
  }, [artifactReview]);

  if (!artifactReview) return null;

  const handleApprove = () => {
    dispatch(resolveArtifactReview({ verdict: 'approve' }));
    setFeedback('');
  };

  const handleReject = () => {
    dispatch(resolveArtifactReview({ verdict: 'reject', feedback }));
    setFeedback('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="flex flex-col w-11/12 max-w-4xl h-5/6 bg-codernic-darker border border-codernic-primary/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between px-6 py-4 bg-codernic-primary/10 border-b border-codernic-primary/20">
          <h2 className="text-xl font-semibold text-white">Review Artifact: {artifactReview.title}</h2>
          <span className="px-3 py-1 text-xs font-medium text-codernic-primary bg-codernic-primary/20 rounded-full">
            Human Approval Required
          </span>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto prose prose-invert max-w-none custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-t-codernic-primary rounded-full animate-spin border-codernic-primary/30"></div>
            </div>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>

        <div className="p-6 bg-codernic-darker border-t border-codernic-primary/20 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Feedback (Optional)</label>
            <textarea
              className="w-full bg-codernic-dark border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-codernic-primary focus:ring-1 focus:ring-codernic-primary transition-colors resize-none"
              rows={2}
              placeholder="What changes would you like to see?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end gap-4">
            <button
              onClick={handleReject}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all active:scale-95"
            >
              Reject & Revise
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-2.5 text-sm font-semibold text-codernic-darker bg-codernic-primary hover:brightness-110 shadow-[0_0_15px_rgba(var(--color-codernic-primary),0.5)] rounded-lg transition-all active:scale-95"
            >
              Approve & Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
