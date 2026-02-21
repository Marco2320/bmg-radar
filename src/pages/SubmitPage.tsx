import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { store } from '@/lib/store';
import { PLATFORMS, PLATFORM_PLACEHOLDERS, TERRITORIES, GENRES, Platform } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LinkEntry {
  platform: Platform;
  url: string;
}

const SubmitPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [artistName, setArtistName] = useState('');
  const [territory, setTerritory] = useState('');
  const [genre, setGenre] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [rationale, setRationale] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [links, setLinks] = useState<LinkEntry[]>([{ platform: 'Spotify', url: '' }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addLink = () => setLinks([...links, { platform: 'Spotify', url: '' }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: keyof LinkEntry, value: string) => {
    setLinks(links.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!artistName.trim()) errs.artistName = 'Artist name is required.';
    if (!territory) errs.territory = 'Territory is required.';
    if (!genre) errs.genre = 'Genre is required.';
    if (genre === 'Other' && !customGenre.trim()) errs.customGenre = 'Please specify the genre.';
    if (!rationale.trim()) errs.rationale = 'Rationale is required.';
    if (rationale.length > 300) errs.rationale = 'Rationale must be 300 characters or less.';
    if (imageUrl.trim() && !imageUrl.trim().startsWith('http')) errs.imageUrl = 'URL must start with http:// or https://';

    const hasValidLink = links.some(l => l.url.trim().length > 0);
    if (!hasValidLink) errs.links = 'At least one valid URL is required.';

    links.forEach((l, i) => {
      if (l.url.trim() && !l.url.trim().startsWith('http')) {
        errs[`link_${i}`] = 'URL must start with http:// or https://';
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validLinks = links.filter(l => l.url.trim());
    store.addSubmission({
      artist_name: artistName.trim(),
      territory,
      genre,
      custom_genre: genre === 'Other' ? customGenre.trim() : undefined,
      rationale: rationale.trim(),
      submitted_by: user.id,
      image_url: imageUrl.trim() || undefined,
      links: validLinks.map(l => ({
        id: '',
        submission_id: '',
        platform: l.platform,
        url: l.url.trim(),
        created_at: '',
      })),
    });

    toast({ title: 'Artist submitted', description: `${artistName} has been added to the feed.` });
    navigate('/');
  };

  return (
    <div className="container px-6 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Submit an Artist</h1>
        <p className="text-sm text-muted-foreground">Add an artist to the discovery radar for the team to review.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Artist Name */}
        <div className="space-y-1.5">
          <Label htmlFor="artist-name">Artist Name *</Label>
          <Input
            id="artist-name"
            value={artistName}
            onChange={e => setArtistName(e.target.value)}
            placeholder="Enter artist name"
            className="bmg-focus-ring"
            maxLength={100}
          />
          {errors.artistName && <p className="text-xs text-destructive">{errors.artistName}</p>}
        </div>

        {/* Artist Image URL */}
        <div className="space-y-1.5">
          <Label htmlFor="image-url">Artist Image URL</Label>
          <Input
            id="image-url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://... (optional — paste a profile image URL)"
            className="bmg-focus-ring text-sm"
          />
          {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl}</p>}
          <p className="text-xs text-muted-foreground">Tip: right-click an artist's profile picture on Spotify, YouTube, etc. and copy the image URL.</p>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <Label>Links *</Label>
          {errors.links && <p className="text-xs text-destructive">{errors.links}</p>}
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Select
                value={link.platform}
                onValueChange={(v: Platform) => updateLink(i, 'platform', v)}
              >
                <SelectTrigger className="w-[140px] h-9 text-sm shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1">
                <Input
                  value={link.url}
                  onChange={e => updateLink(i, 'url', e.target.value)}
                  placeholder={PLATFORM_PLACEHOLDERS[link.platform]}
                  className="bmg-focus-ring text-sm"
                />
                {errors[`link_${i}`] && <p className="text-xs text-destructive mt-1">{errors[`link_${i}`]}</p>}
              </div>
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-1 text-xs font-medium bmg-link"
          >
            <Plus className="h-3 w-3" /> Add another link
          </button>
        </div>

        {/* Territory */}
        <div className="space-y-1.5">
          <Label>Territory *</Label>
          <Select value={territory} onValueChange={setTerritory}>
            <SelectTrigger className="bmg-focus-ring">
              <SelectValue placeholder="Select territory" />
            </SelectTrigger>
            <SelectContent>
              {TERRITORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.territory && <p className="text-xs text-destructive">{errors.territory}</p>}
        </div>

        {/* Genre */}
        <div className="space-y-1.5">
          <Label>Genre *</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="bmg-focus-ring">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          {genre === 'Other' && (
            <div className="mt-2">
              <Input
                value={customGenre}
                onChange={e => setCustomGenre(e.target.value)}
                placeholder="Specify genre (e.g., Amapiano, Drill, Hyperpop)"
                className="bmg-focus-ring text-sm"
                maxLength={50}
              />
              {errors.customGenre && <p className="text-xs text-destructive mt-1">{errors.customGenre}</p>}
            </div>
          )}
          {errors.genre && <p className="text-xs text-destructive">{errors.genre}</p>}
        </div>

        {/* Rationale */}
        <div className="space-y-1.5">
          <Label htmlFor="rationale">Short Rationale * <span className="text-muted-foreground font-normal">({rationale.length}/300)</span></Label>
          <Textarea
            id="rationale"
            value={rationale}
            onChange={e => setRationale(e.target.value)}
            placeholder="Why should BMG look at this artist?"
            maxLength={300}
            rows={3}
            className="bmg-focus-ring resize-none"
          />
          {errors.rationale && <p className="text-xs text-destructive">{errors.rationale}</p>}
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full sm:w-auto">
            Submit Artist
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SubmitPage;
