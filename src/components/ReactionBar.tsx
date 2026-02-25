import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp } from 'lucide-react';

interface ReactionBarProps {
  submissionId: string;
  onReactionChange?: () => void;
  compact?: boolean;
}

const ReactionBar: React.FC<ReactionBarProps> = ({ submissionId, onReactionChange, compact = false }) => {
  const { user } = useAuth();
  const [animating, setAnimating] = useState(false);

  const hasVoted = store.hasVoted(submissionId, user.id);
  const count = store.getReactionCount(submissionId);

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.toggleVote(submissionId, user.id);
    setAnimating(true);
    onReactionChange?.();
  };

  useEffect(() => {
    if (animating) {
      const t = setTimeout(() => setAnimating(false), 400);
      return () => clearTimeout(t);
    }
  }, [animating]);

  return (
    <button
      onClick={handleVote}
      className={`inline-flex items-center gap-1.5 rounded-full transition-all bmg-focus-ring ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${
        hasVoted
          ? 'bg-accent/20 ring-1 ring-accent text-accent-foreground'
          : 'hover:bg-muted text-muted-foreground'
      }`}
    >
      <ThumbsUp className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${animating ? 'reaction-pop' : ''} ${hasVoted ? 'fill-current' : ''}`} />
      {count > 0 && (
        <span className={`font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {count}
        </span>
      )}
    </button>
  );
};

export default ReactionBar;
