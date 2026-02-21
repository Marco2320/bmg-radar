import React, { useState, useMemo, useCallback } from 'react';
import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { TERRITORIES, GENRES, STATUSES } from '@/types';
import SubmissionCard from '@/components/SubmissionCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ITEMS_PER_PAGE = 10;

const FeedPage: React.FC = () => {
  const { isAR } = useAuth();
  const [sort, setSort] = useState<'newest' | 'most_upvoted'>('newest');
  const [territory, setTerritory] = useState<string>('all');
  const [genre, setGenre] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const filtered = useMemo(() => {
    let subs = store.getSubmissions();
    if (territory !== 'all') subs = subs.filter(s => s.territory === territory);
    if (genre !== 'all') subs = subs.filter(s => s.genre === genre);
    if (status !== 'all') subs = subs.filter(s => s.status === status);

    if (sort === 'newest') {
      subs.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else {
      subs.sort((a, b) => store.getVoteCount(b.id) - store.getVoteCount(a.id));
    }
    return subs;
  }, [sort, territory, genre, status]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="container px-6 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Artist Feed</h1>
        <p className="text-sm text-muted-foreground">Browse submitted artists and surface discovery signals.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={sort} onValueChange={(v: 'newest' | 'most_upvoted') => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="most_upvoted">Most Upvoted</SelectItem>
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
  );
};

export default FeedPage;
