import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmission, useVoteCount, useHasVoted, useComments, useToggleVote, useAddComment, useUpdateStatus, useUser } from '@/hooks/use-api';
import { STATUSES, SubmissionStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ExternalLink, ArrowLeft, MessageSquare, Music } from 'lucide-react';

const CommentAuthor: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: author } = useUser(userId);
  return <span className="text-sm font-medium">{author?.name ?? '…'}</span>;
};

const SubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAR } = useAuth();
  const [commentText, setCommentText] = useState('');

  const { data: submission, isLoading } = useSubmission(id || '');
  const { data: voteCount = 0 } = useVoteCount(id || '');
  const { data: hasVoted = false } = useHasVoted(id || '', user.id);
  const { data: comments = [] } = useComments(id || '');
  const { data: submitter } = useUser(submission?.submitted_by || '');

  const toggleVote = useToggleVote();
  const addComment = useAddComment();
  const updateStatus = useUpdateStatus();

  if (isLoading) {
    return (
      <div className="container px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container px-6 py-12 text-center">
        <p className="text-muted-foreground mb-4">Submission not found.</p>
        <Link to="/" className="bmg-link text-sm">← Back to feed</Link>
      </div>
    );
  }

  const handleVote = () => {
    toggleVote.mutate({ submissionId: submission.id, userId: user.id });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate(
      { submissionId: submission.id, userId: user.id, text: commentText.trim() },
      { onSuccess: () => setCommentText('') },
    );
  };

  const handleStatusChange = (status: SubmissionStatus) => {
    updateStatus.mutate({ id: submission.id, status });
  };

  return (
    <div className="container px-6 py-8 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>

      <div className="bmg-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {submission.image_url ? (
                <img src={submission.image_url} alt={submission.artist_name} className="w-full h-full object-cover" />
              ) : (
                <Music className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold mb-1">{submission.artist_name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{submission.territory}</span>
                <span>·</span>
                <span>{submission.genre === 'Other' && submission.custom_genre ? `Other (${submission.custom_genre})` : submission.genre}</span>
                <span>·</span>
                <span>by {submitter?.name}</span>
                <span>·</span>
                <span>{new Date(submission.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAR && <StatusBadge status={submission.status} />}
            <button
              onClick={handleVote}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors bmg-focus-ring ${
                hasVoted
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUp className="h-4 w-4" />
              {voteCount}
            </button>
          </div>
        </div>

        <p className="text-sm text-foreground/80 mb-5">{submission.rationale}</p>

        {/* Links */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</h3>
          <div className="flex flex-wrap gap-2">
            {submission.links.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium bmg-link bg-muted px-3 py-1.5 rounded"
              >
                <ExternalLink className="h-3 w-3" />
                {link.platform}
              </a>
            ))}
          </div>
        </div>

        {/* A&R Status Control */}
        {isAR && (
          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
              <Select value={submission.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Comments */}
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold mb-4">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </h2>

        <div className="space-y-3 mb-5">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bmg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CommentAuthor userId={c.user_id} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80">{c.comment_text}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleComment} className="space-y-3">
          <Textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="bmg-focus-ring resize-none"
            maxLength={500}
          />
          <Button type="submit" disabled={!commentText.trim() || addComment.isPending} size="sm">
            {addComment.isPending ? 'Posting…' : 'Post Comment'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SubmissionDetailPage;
