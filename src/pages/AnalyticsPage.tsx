import React, { useMemo } from 'react';
import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageCircle, ArrowUpRight } from 'lucide-react';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const AnalyticsPage: React.FC = () => {
  const { isAR } = useAuth();
  const submissions = store.getSubmissions();
  const allVotes = store.getAllVotes();

  const now = Date.now();
  const sevenDaysAgo = new Date(now - SEVEN_DAYS_MS).toISOString();

  const trending = useMemo(() => {
    const allComments = submissions.flatMap(s => store.getComments(s.id));

    const scored = submissions.map(s => {
      const recentVotes = allVotes.filter(v => v.submission_id === s.id && v.created_at >= sevenDaysAgo).length;
      const recentComments = allComments.filter(c => c.submission_id === s.id && c.created_at >= sevenDaysAgo).length;
      const engagementScore = recentVotes * 2 + recentComments * 3;
      return { ...s, recentVotes, recentComments, engagementScore };
    });

    const topTrending = [...scored].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 5);
    const fastestRising = [...scored].sort((a, b) => b.recentVotes - a.recentVotes)[0] || null;
    const mostDiscussed = [...scored].sort((a, b) => b.recentComments - a.recentComments)[0] || null;

    return { topTrending, fastestRising, mostDiscussed };
  }, [submissions, allVotes, sevenDaysAgo]);

  const stats = useMemo(() => {
    const byTerritory: Record<string, number> = {};
    const byGenre: Record<string, number> = {};

    submissions.forEach(s => {
      byTerritory[s.territory] = (byTerritory[s.territory] || 0) + 1;
      byGenre[s.genre] = (byGenre[s.genre] || 0) + 1;
    });

    const topUpvoted = [...submissions]
      .map(s => ({ ...s, votes: store.getVoteCount(s.id) }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);

    return {
      totalSubmissions: submissions.length,
      totalVotes: allVotes.length,
      byTerritory: Object.entries(byTerritory).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      byGenre: Object.entries(byGenre).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      topUpvoted,
    };
  }, [submissions, allVotes]);

  const chartColor = 'hsl(199, 57%, 19%)';

  if (!isAR) return <Navigate to="/" replace />;

  return (
    <div className="container px-6 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Analytics</h1>
        <p className="text-sm text-muted-foreground">Overview of discovery signals across the platform.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bmg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Total Submissions</p>
          <p className="text-3xl font-semibold">{stats.totalSubmissions}</p>
        </div>
        <div className="bmg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Total Votes</p>
          <p className="text-3xl font-semibold">{stats.totalVotes}</p>
        </div>
      </div>

      {/* Trending This Week */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold">Trending This Week</h2>
          <div className="flex-1 h-px bg-accent/60" />
        </div>

        {/* Top 5 Trending */}
        <div className="bmg-card divide-y divide-border mb-4">
          {trending.topTrending.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground text-center">No activity in the last 7 days.</div>
          ) : (
            trending.topTrending.map((s, i) => (
              <Link to={`/submission/${s.id}`} key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm font-medium">{s.artist_name}</span>
                  <span className="text-xs text-muted-foreground">{s.territory} · {s.genre}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{s.recentVotes} votes</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{s.recentComments} comments</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Fastest Rising & Most Discussed */}
        <div className="grid grid-cols-2 gap-4">
          {trending.fastestRising && trending.fastestRising.recentVotes > 0 && (
            <Link to={`/submission/${trending.fastestRising.id}`} className="bmg-card p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowUpRight className="w-3.5 h-3.5 text-accent-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fastest Rising</p>
              </div>
              <p className="text-sm font-medium">{trending.fastestRising.artist_name}</p>
              <p className="text-xs text-muted-foreground">{trending.fastestRising.recentVotes} votes this week</p>
            </Link>
          )}
          {trending.mostDiscussed && trending.mostDiscussed.recentComments > 0 && (
            <Link to={`/submission/${trending.mostDiscussed.id}`} className="bmg-card p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageCircle className="w-3.5 h-3.5 text-accent-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most Discussed</p>
              </div>
              <p className="text-sm font-medium">{trending.mostDiscussed.artist_name}</p>
              <p className="text-xs text-muted-foreground">{trending.mostDiscussed.recentComments} comments this week</p>
            </Link>
          )}
        </div>
      </div>

      {/* Most Upvoted */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Most Upvoted</h2>
        <div className="bmg-card divide-y divide-border">
          {stats.topUpvoted.map((s, i) => (
            <Link to={`/submission/${s.id}`} key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                <span className="text-sm font-medium">{s.artist_name}</span>
                <span className="text-xs text-muted-foreground">{s.territory} · {s.genre}</span>
              </div>
              <span className="text-sm font-semibold">{s.votes} votes</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold mb-3">By Territory</h2>
          <div className="bmg-card p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byTerritory} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
                <Tooltip />
                <Bar dataKey="count" fill={chartColor} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-3">By Genre</h2>
          <div className="bmg-card p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byGenre} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
                <Tooltip />
                <Bar dataKey="count" fill={chartColor} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
