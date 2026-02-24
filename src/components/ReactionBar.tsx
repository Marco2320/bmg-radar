import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { REACTION_EMOJIS, REACTION_LABELS, REACTION_TYPES, ReactionType } from '@/types';

interface ReactionBarProps {
  submissionId: string;
  onReactionChange?: () => void;
  compact?: boolean;
}

const ReactionBar: React.FC<ReactionBarProps> = ({ submissionId, onReactionChange, compact = false }) => {
  const { user } = useAuth();
  const [animating, setAnimating] = useState<string | null>(null);

  const userReaction = store.getUserReaction(submissionId, user.id);
  const counts = store.getReactionCounts(submissionId);

  const handleReaction = (type: ReactionType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.setReaction(submissionId, user.id, type);
    setAnimating(type);
    onReactionChange?.();
  };

  useEffect(() => {
    if (animating) {
      const t = setTimeout(() => setAnimating(null), 400);
      return () => clearTimeout(t);
    }
  }, [animating]);

  return (
    <div className="flex items-center gap-1">
      {REACTION_TYPES.map(type => {
        const isActive = userReaction === type;
        const count = counts[type];
        return (
          <button
            key={type}
            onClick={(e) => handleReaction(type, e)}
            title={REACTION_LABELS[type]}
            className={`inline-flex items-center gap-1 rounded-full transition-all bmg-focus-ring ${
              compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
            } ${
              isActive
                ? 'bg-accent/20 ring-1 ring-accent'
                : 'hover:bg-muted'
            }`}
          >
            <span className={`${animating === type ? 'reaction-pop' : ''} ${compact ? 'text-sm' : 'text-base'}`}>
              {REACTION_EMOJIS[type]}
            </span>
            {count > 0 && (
              <span className={`font-medium ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'} ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ReactionBar;
