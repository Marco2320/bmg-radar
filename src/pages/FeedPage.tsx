import React, { useState, useMemo, useCallback } from 'react';
import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { TERRITORIES, GENRES, STATUSES } from '@/types';
import SubmissionCard from '@/components/SubmissionCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Music, X, CheckCircle2 } from 'lucide-react';
import ReactionBar from '@/components/ReactionBar';

const ITEMS_PER_PAGE = 10;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const FeedPage: React.FC = () => {
  const { isAR, user } = useAuth();
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(!!(location.state as any)?.submitted);
  const [sort, setSort] = useState<'newest' | 'most_reacted'>('newest');
  const [territory, setTerritory] = useState<string>('all');
  const [genre, setGenre] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const submissions = store.getSubmissions();
  const allReactions = store.getAllReactions();
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const trending = useMemo(() => {
    let subs = store.getSubmissions();
    if (territory !== 'all') subs = subs.filter(s => s.territory === territory);
    if (genre !== 'all') subs = subs.filter(s => s.genre === genre);
    if (status !== 'all') subs = subs.filter(s => s.status === status);

    const allComments = subs.flatMap(s => store.getComments(s.id));
    return subs
      .map(s => {
        const recentReactions = allReactions.filter(r => r.submission_id === s.id && r.created_at >= sevenDaysAgo).length;
        const recentComments = allComments.filter(c => c.submission_id === s.id && c.created_at >= sevenDaysAgo).length;
        return { ...s, engagementScore: recentReactions * 2 + recentComments * 3, recentReactions };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 3);
  }, [submissions, allReactions, sevenDaysAgo, territory, genre, status, tick]);

  const filtered = useMemo(() => {
    let subs = store.getSubmissions();
    if (territory !== 'all') subs = subs.filter(s => s.territory === territory);
    if (genre !== 'all') subs = subs.filter(s => s.genre === genre);
    if (status !== 'all') subs = subs.filter(s => s.status === status);

    if (sort === 'newest') {
      subs.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else {
      subs.sort((a, b) => store.getReactionCount(b.id) - store.getReactionCount(a.id));
    }
    return subs;
  }, [sort, territory, genre, status, tick]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <>
      {showBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="relative mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-lg text-center animate-scale-in">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-end justify-center gap-1 mb-5 h-8">
              {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-primary"
                  style={{ animation: `musicBar 1s ease-in-out ${delay}s infinite alternate` }}
                />
              ))}
            </div>
            <h3 className="font-semibold text-lg mb-2">Thanks for submitting this artist to BMG Radar!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The recommendation is now live on the platform and visible to the A&R teams. Your contribution helps surface new talent and keeps our discovery culture active across BMG.
            </p>
          </div>
        </div>
      )}

      <div className="container px-6 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">Artist Feed</h1>
          <p className="text-sm text-muted-foreground">Browse submitted artists and surface discovery signals.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Select value={sort} onValueChange={(v: 'newest' | 'most_reacted') => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="most_reacted">Most Reacted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={territory} onValueChange={(v) => { setTerritory(v); setPage(1); }}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Territory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Territories</SelectItem>
              {TERRITORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={genre} onValueChange={(v) => { setGenre(v); setPage(1); }}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>

          {isAR && (
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Trending Now */}
        {trending.length > 0 && trending[0].engagementScore > 0 && (
          <div className="mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-accent-foreground" />
              <h2 className="text-sm font-semibold">Trending Now</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {trending.filter(t => t.engagementScore > 0).map(s => (
                <Link
                  to={`/submission/${s.id}`}
                  key={s.id}
                  className="bmg-card p-4 min-w-[200px] flex-shrink-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.artist_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium truncate">{s.artist_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{s.territory} · {s.genre}</p>
                  <ReactionBar submissionId={s.id} onReactionChange={refresh} compact />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {paged.length === 0 ? (
            <div className="bmg-section-muted text-center py-12 text-sm text-muted-foreground">
              No submissions match the current filters.
            </div>
          ) : (
            paged.map(sub => (
              <SubmissionCard key={sub.id} submission={sub} onVoteChange={refresh} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-colors bmg-focus-ring ${
                  page === i + 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FeedPage;
