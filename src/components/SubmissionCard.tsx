import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Submission } from '@/types';
import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { MessageSquare, ExternalLink, ChevronDown, ChevronUp, ArrowUp } from 'lucide-react';

interface SubmissionCardProps {
  submission: Submission;
  onVoteChange?: () => void;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onVoteChange }) => {
  const { user, isAR } = useAuth();
  const [showLinks, setShowLinks] = useState(false);

  const commentCount = store.getCommentCount(submission.id);
  const voteCount = store.getReactionCount(submission.id);
  const hasVoted = store.hasVoted(submission.id, user.id);
  const primaryLink = submission.links[0];
  const submitter = store.getUser(submission.submitted_by);
  const displayGenre = submission.genre === 'Other' && submission.custom_genre
    ? `Other (${submission.custom_genre})`
    : submission.genre;

  const handleStatusChange = (newStatus: Submission['status']) => {
    store.updateStatus(submission.id, newStatus);
    onVoteChange?.();
  };

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.toggleVote(submission.id, user.id);
    onVoteChange?.();
  };

  return (
    <div className="bmg-card p-5">
      <div className="flex gap-4">
        {/* Upvote column */}
        <button
          onClick={handleVote}
          className={`flex flex-col items-center gap-0.5 pt-1 shrink-0 transition-colors bmg-focus-ring rounded ${
            hasVoted ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowUp className={`h-5 w-5 ${hasVoted ? 'stroke-[2.5]' : ''}`} />
          <span className={`text-sm font-semibold ${hasVoted ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
            {voteCount}
          </span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <Link to={`/submission/${submission.id}`} className="group">
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {submission.artist_name}
              </h3>
            </Link>
            {isAR && (
              <StatusBadge
                status={submission.status}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>{submission.territory}</span>
            <span>·</span>
            <span>{displayGenre}</span>
            <span>·</span>
            {isAR ? (
              <span>{submitter?.name}</span>
            ) : (
              <span className="italic">Anonymous</span>
            )}
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
