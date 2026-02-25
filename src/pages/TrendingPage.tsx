import React, { useMemo, useState } from 'react';
import { store } from '@/lib/store';
import { Link } from 'react-router-dom';
import { TERRITORIES, GENRES } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Flame, MessageCircle, Music } from 'lucide-react';
import ReactionBar from '@/components/ReactionBar';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const TrendingPage: React.FC = () => {
  const [territory, setTerritory] = useState('all');
  const [genre, setGenre] = useState('all');
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [tick, setTick] = useState(0);

  const periodMs = period === '7d' ? SEVEN_DAYS_MS : THIRTY_DAYS_MS;
  const cutoff = new Date(Date.now() - periodMs).toISOString();
  const allReactions = store.getAllReactions();

  const data = useMemo(() => {
    let subs = store.getSubmissions();
    if (territory !== 'all') subs = subs.filter(s => s.territory === territory);
    if (genre !== 'all') subs = subs.filter(s => s.genre === genre);

    const scored = subs.map(s => {
      const recentReactions = allReactions.filter(r => r.submission_id === s.id && r.created_at >= cutoff);
      const recentComments = store.getComments(s.id).filter(c => c.created_at >= cutoff);
      const totalReactions = store.getReactionCount(s.id);
      return {
        ...s,
        recentReactionCount: recentReactions.length,
        recentCommentCount: recentComments.length,
        engagementScore: recentReactions.length * 2 + recentComments.length * 3,
        totalReactions,
      };
    });

    const topTrending = [...scored].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 10);
    const mostReacted = [...scored].sort((a, b) => b.totalReactions - a.totalReactions).slice(0, 5);

    return { topTrending, mostReacted };
  }, [territory, genre, period, allReactions, cutoff, tick]);

  return (
    <div className="container px-6 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Trending</h1>
        <p className="text-sm text-muted-foreground">See what's buzzing across the platform right now.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={period} onValueChange={(v: '7d' | '30d') => setPeriod(v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={territory} onValueChange={setTerritory}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Territory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Territories</SelectItem>
            {TERRITORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Genre" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Top Trending */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent-foreground" />
          <h2 className="text-sm font-semibold">Top Trending</h2>
        </div>
        <div className="bmg-card divide-y divide-border">
          {data.topTrending.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground text-center">No activity in this period.</div>
          ) : (
            data.topTrending.map((s, i) => (
              <Link to={`/submission/${s.id}`} key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {s.image_url ? <img src={s.image_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  <span className="text-sm font-medium">{s.artist_name}</span>
                  <span className="text-xs text-muted-foreground">{s.territory} · {s.genre}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{s.recentReactionCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{s.recentCommentCount}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Most Reacted All Time */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Most Reacted (All Time)</h2>
        <div className="bmg-card divide-y divide-border">
          {data.mostReacted.map((s, i) => (
            <Link to={`/submission/${s.id}`} key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                <span className="text-sm font-medium">{s.artist_name}</span>
              </div>
              <span className="text-sm font-semibold">{s.totalReactions} reactions</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingPage;
