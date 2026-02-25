import React, { useMemo, useState } from 'react';
import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { TERRITORIES, GENRES, STATUSES, SubmissionStatus } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageCircle, ArrowUp, Music } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const ScoutingPage: React.FC = () => {
  const { isAR } = useAuth();
  const [territory, setTerritory] = useState('all');
  const [genre, setGenre] = useState('all');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  const periodMs = period === '7d' ? SEVEN_DAYS_MS : period === '30d' ? THIRTY_DAYS_MS : Infinity;
  const cutoff = period === 'all' ? '1970-01-01T00:00:00Z' : new Date(Date.now() - periodMs).toISOString();
  const allReactions = store.getAllReactions();

  const data = useMemo(() => {
    let subs = store.getSubmissions();
    if (territory !== 'all') subs = subs.filter(s => s.territory === territory);
    if (genre !== 'all') subs = subs.filter(s => s.genre === genre);
    if (status !== 'all') subs = subs.filter(s => s.status === status);

    // Pipeline
    const pipeline: Record<string, number> = {};
    STATUSES.forEach(s => { pipeline[s] = 0; });
    subs.forEach(s => { pipeline[s.status] = (pipeline[s.status] || 0) + 1; });
    const pipelineData = STATUSES.map(s => ({ name: s, count: pipeline[s] }));

    // Top engaged
    const scored = subs.map(s => {
      const reactions = allReactions.filter(r => r.submission_id === s.id && r.created_at >= cutoff).length;
      const comments = store.getComments(s.id).filter(c => c.created_at >= cutoff).length;
      return { ...s, reactions, comments, score: reactions * 2 + comments * 3, totalReactions: store.getReactionCount(s.id) };
    });

    const topEngaged = [...scored].sort((a, b) => b.score - a.score).slice(0, 5);
    const mostDiscussed = [...scored].sort((a, b) => b.comments - a.comments).slice(0, 5);

    // By territory
    const byTerritory: Record<string, number> = {};
    subs.forEach(s => { byTerritory[s.territory] = (byTerritory[s.territory] || 0) + 1; });
    const territoryData = Object.entries(byTerritory).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return { pipelineData, topEngaged, mostDiscussed, territoryData, total: subs.length };
  }, [territory, genre, status, period, allReactions, cutoff]);

  const chartColor = 'hsl(199, 57%, 19%)';

  if (!isAR) return <Navigate to="/" replace />;

  return (
    <div className="container px-6 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Scouting</h1>
        <p className="text-sm text-muted-foreground">A&R pipeline and engagement analysis.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={period} onValueChange={(v: '7d' | '30d' | 'all') => setPeriod(v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={territory} onValueChange={setTerritory}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Territories</SelectItem>
            {TERRITORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Pipeline</h2>
        <div className="grid grid-cols-5 gap-3">
          {data.pipelineData.map(p => (
            <div key={p.name} className="bmg-card p-4 text-center">
              <StatusBadge status={p.name as SubmissionStatus} className="mb-2" />
              <p className="text-2xl font-semibold">{p.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Engaged */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUp className="w-4 h-4 text-accent-foreground" />
          <h2 className="text-sm font-semibold">Top Engaged</h2>
        </div>
        <div className="bmg-card divide-y divide-border">
          {data.topEngaged.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground text-center">No data.</div>
          ) : (
            data.topEngaged.map((s, i) => (
              <Link to={`/submission/${s.id}`} key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm font-medium">{s.artist_name}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />{s.reactions}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{s.comments}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Most Discussed */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-accent-foreground" />
          <h2 className="text-sm font-semibold">Most Discussed</h2>
        </div>
        <div className="bmg-card divide-y divide-border">
          {data.mostDiscussed.filter(s => s.comments > 0).length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground text-center">No comments in this period.</div>
          ) : (
            data.mostDiscussed.filter(s => s.comments > 0).map((s, i) => (
              <Link to={`/submission/${s.id}`} key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm font-medium">{s.artist_name}</span>
                </div>
                <span className="text-sm font-semibold">{s.comments} comments</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* By Territory Chart */}
      <div>
        <h2 className="text-sm font-semibold mb-3">By Territory</h2>
        <div className="bmg-card p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.territoryData} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
              <Tooltip />
              <Bar dataKey="count" fill={chartColor} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ScoutingPage;
