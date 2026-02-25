import React, { useMemo, useState } from 'react';
import { store, MOCK_USERS } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { TERRITORIES, GENRES, STATUSES, SubmissionStatus } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MessageCircle, Flame, Users, FileText, Activity } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const PIE_COLORS = ['hsl(199, 57%, 19%)', 'hsl(199, 57%, 35%)', 'hsl(72, 89%, 46%)', 'hsl(199, 57%, 55%)', 'hsl(72, 60%, 55%)'];

const OverviewPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [territory, setTerritory] = useState('all');
  const [genre, setGenre] = useState('all');
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('all');

  const periodMs = period === '7d' ? SEVEN_DAYS_MS : period === '30d' ? THIRTY_DAYS_MS : Infinity;
  const cutoff = period === 'all' ? '1970-01-01T00:00:00Z' : new Date(Date.now() - periodMs).toISOString();
  const allReactions = store.getAllReactions();

  const data = useMemo(() => {
    let subs = store.getSubmissions();
    if (territory !== 'all') subs = subs.filter(s => s.territory === territory);
    if (genre !== 'all') subs = subs.filter(s => s.genre === genre);

    const filteredReactions = allReactions.filter(r => r.created_at >= cutoff);
    const allComments = subs.flatMap(s => store.getComments(s.id)).filter(c => c.created_at >= cutoff);

    // KPIs
    const totalSubmissions = subs.length;
    const totalReactions = filteredReactions.filter(r => subs.some(s => s.id === r.submission_id)).length;
    const totalComments = allComments.length;
    const activeUsers = new Set([
      ...filteredReactions.map(r => r.user_id),
      ...allComments.map(c => c.user_id),
      ...subs.filter(s => s.created_at >= cutoff).map(s => s.submitted_by),
    ]).size;

    // Pipeline breakdown
    const pipeline: Record<string, number> = {};
    STATUSES.forEach(s => { pipeline[s] = 0; });
    subs.forEach(s => { pipeline[s.status] = (pipeline[s.status] || 0) + 1; });
    const pipelineData = STATUSES.map(s => ({ name: s, count: pipeline[s] }));

    // By territory
    const byTerritory: Record<string, number> = {};
    subs.forEach(s => { byTerritory[s.territory] = (byTerritory[s.territory] || 0) + 1; });
    const territoryData = Object.entries(byTerritory).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // By genre
    const byGenre: Record<string, number> = {};
    subs.forEach(s => { byGenre[s.genre] = (byGenre[s.genre] || 0) + 1; });
    const genreData = Object.entries(byGenre).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Top submitters
    const submitterCounts: Record<string, number> = {};
    subs.forEach(s => { submitterCounts[s.submitted_by] = (submitterCounts[s.submitted_by] || 0) + 1; });
    const topSubmitters = Object.entries(submitterCounts)
      .map(([userId, count]) => ({ user: store.getUser(userId), count }))
      .filter(s => s.user)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top engaged
    const topEngaged = subs.map(s => {
      const rCount = filteredReactions.filter(r => r.submission_id === s.id).length;
      const cCount = allComments.filter(c => c.submission_id === s.id).length;
      return { ...s, reactions: rCount, comments: cCount, score: rCount * 2 + cCount * 3 };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    return { totalSubmissions, totalReactions, totalComments, activeUsers, pipelineData, territoryData, genreData, topSubmitters, topEngaged };
  }, [territory, genre, period, allReactions, cutoff]);

  const chartColor = 'hsl(199, 57%, 19%)';

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container px-6 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Overview</h1>
        <p className="text-sm text-muted-foreground">Master analytics dashboard — full platform visibility.</p>
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
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bmg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Submissions</p>
          </div>
          <p className="text-3xl font-semibold">{data.totalSubmissions}</p>
        </div>
        <div className="bmg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reactions</p>
          </div>
          <p className="text-3xl font-semibold">{data.totalReactions}</p>
        </div>
        <div className="bmg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Comments</p>
          </div>
          <p className="text-3xl font-semibold">{data.totalComments}</p>
        </div>
        <div className="bmg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Users</p>
          </div>
          <p className="text-3xl font-semibold">{data.activeUsers}</p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Pipeline Status</h2>
        <div className="grid grid-cols-5 gap-3">
          {data.pipelineData.map(p => (
            <div key={p.name} className="bmg-card p-4 text-center">
              <StatusBadge status={p.name as SubmissionStatus} className="mb-2" />
              <p className="text-2xl font-semibold">{p.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-sm font-semibold mb-3">By Territory</h2>
          <div className="bmg-card p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.territoryData} layout="vertical" margin={{ left: 80 }}>
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.genreData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
                <Tooltip />
                <Bar dataKey="count" fill={chartColor} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Submitters */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-accent-foreground" />
          <h2 className="text-sm font-semibold">Top Submitters</h2>
        </div>
        <div className="bmg-card divide-y divide-border">
          {data.topSubmitters.map((s, i) => (
            <div key={s.user?.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                <span className="text-sm font-medium">{s.user?.name}</span>
                <span className="text-xs text-muted-foreground">{s.user?.role === 'ar' ? 'A&R' : s.user?.role === 'admin' ? 'Admin' : 'Employee'}</span>
              </div>
              <span className="text-sm font-semibold">{s.count} submissions</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Engaged */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-accent-foreground" />
          <h2 className="text-sm font-semibold">Top Engaged Artists</h2>
        </div>
        <div className="bmg-card divide-y divide-border">
          {data.topEngaged.map((s, i) => (
            <Link to={`/submission/${s.id}`} key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                <span className="text-sm font-medium">{s.artist_name}</span>
                <StatusBadge status={s.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{s.reactions} reactions</span>
                <span>{s.comments} comments</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
