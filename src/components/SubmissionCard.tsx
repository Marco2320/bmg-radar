import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Submission } from '@/types';
import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { ArrowUp, MessageSquare, ExternalLink, ChevronDown, ChevronUp, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubmissionCardProps {
  submission: Submission;
  onVoteChange?: () => void;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onVoteChange }) => {
  const { user, isAR } = useAuth();
  const [showLinks, setShowLinks] = useState(false);

  const voteCount = store.getVoteCount(submission.id);
  const hasVoted = store.hasVoted(submission.id, user.id);
  const commentCount = store.getCommentCount(submission.id);
  const primaryLink = submission.links[0];
  const submitter = store.getUser(submission.submitted_by);
  const displayGenre = submission.genre === 'Other' && submission.custom_genre
    ? `Other (${submission.custom_genre})`
    : submission.genre;

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.toggleVote(submission.id, user.id);
    onVoteChange?.();
  };

  return (
    <div className="bmg-card p-5">
      <div className="flex gap-4">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <button
            onClick={handleVote}
            className={`flex flex-col items-center gap-0.5 rounded p-1.5 transition-colors bmg-focus-ring ${
              hasVoted
                ? 'text-accent-foreground bg-accent'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={hasVoted ? 'Remove vote' : 'Upvote'}
          >
            <ArrowUp className="h-4 w-4" />
            <span className="text-xs font-semibold">{voteCount}</span>
          </button>
        </div>

        {/* Artist image */}
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {submission.image_url ? (
            <img
              src={submission.image_url}
              alt={submission.artist_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('fallback-icon');
              }}
            />
          ) : (
            <Music className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <Link to={`/submission/${submission.id}`} className="group">
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {submission.artist_name}
              </h3>
            </Link>
            {isAR && <StatusBadge status={submission.status} />}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>{submission.territory}</span>
            <span>·</span>
            <span>{displayGenre}</span>
            <span>·</span>
            <span>{submitter?.name}</span>
            <span>·</span>
            <span>{new Date(submission.created_at).toLocaleDateString()}</span>
          </div>

          <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{submission.rationale}</p>

          <div className="flex items-center gap-3 flex-wrap">
            {primaryLink && (
              <a
                href={primaryLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium bmg-link"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                {primaryLink.platform}
              </a>
            )}

            {submission.links.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowLinks(!showLinks); }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showLinks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showLinks ? 'Hide links' : `+${submission.links.length - 1} more`}
              </button>
            )}

            <Link
              to={`/submission/${submission.id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </Link>
          </div>

          {showLinks && (
            <div className="mt-3 flex flex-wrap gap-2">
              {submission.links.slice(1).map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium bmg-link"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionCard;
