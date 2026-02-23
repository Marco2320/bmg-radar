import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAddSubmission } from '@/hooks/use-api';
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
  const addSubmission = useAddSubmission();

  const [artistName, setArtistName] = useState('');
  const [territory, setTerritory] = useState('');
  const [genre, setGenre] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [rationale, setRationale] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
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
    addSubmission.mutate(
      {
        artist_name: artistName.trim(),
        territory,
        genre,
        custom_genre: genre === 'Other' ? customGenre.trim() : undefined,
        rationale: rationale.trim(),
        submitted_by: user.id,
        image_url: imageData || undefined,
        links: validLinks.map(l => ({
          id: '',
          submission_id: '',
          platform: l.platform,
          url: l.url.trim(),
          created_at: '',
        })),
      },
      {
        onSuccess: () => navigate('/', { state: { submitted: true } }),
        onError: (err) => toast({ title: 'Submission failed', description: String(err), variant: 'destructive' }),
      },
    );
  };

  return (
    <div className="container px-6 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Submit an Artist</h1>
        <p className="text-sm text-muted-foreground">Add an artist to the discovery radar for the team to review.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Artist Name */}
        <div className="space-y-1.5">
          <Label htmlFor="artist-name">Artist Name *</Label>
          <Input id="artist-name" value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Enter artist name" className="bmg-focus-ring" maxLength={100} />
          {errors.artistName && <p className="text-xs text-destructive">{errors.artistName}</p>}
        </div>

        {/* Artist Image */}
        <div className="space-y-1.5">
          <Label>Artist Image</Label>
          {imageData ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded bg-muted overflow-hidden shrink-0">
                <img src={imageData} alt="Artist preview" className="w-full h-full object-cover" />
              </div>
              <button type="button" onClick={() => setImageData(null)} className="text-xs font-medium text-destructive hover:underline">Remove image</button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setImageData(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">Optional — upload a profile image for the artist.</p>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3">
          <Label>Links *</Label>
          {errors.links && <p className="text-xs text-destructive">{errors.links}</p>}
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Select value={link.platform} onValueChange={(v: Platform) => updateLink(i, 'platform', v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex-1">
                <Input value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} placeholder={PLATFORM_PLACEHOLDERS[link.platform]} className="bmg-focus-ring text-sm" />
                {errors[`link_${i}`] && <p className="text-xs text-destructive mt-1">{errors[`link_${i}`]}</p>}
              </div>
              {links.length > 1 && (
                <button type="button" onClick={() => removeLink(i)} className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addLink} className="inline-flex items-center gap-1 text-xs font-medium bmg-link">
            <Plus className="h-3 w-3" /> Add another link
          </button>
        </div>

        {/* Territory */}
        <div className="space-y-1.5">
          <Label>Territory *</Label>
          <Select value={territory} onValueChange={setTerritory}>
            <SelectTrigger className="bmg-focus-ring"><SelectValue placeholder="Select territory" /></SelectTrigger>
            <SelectContent>{TERRITORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          {errors.territory && <p className="text-xs text-destructive">{errors.territory}</p>}
        </div>

        {/* Genre */}
        <div className="space-y-1.5">
          <Label>Genre *</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="bmg-focus-ring"><SelectValue placeholder="Select genre" /></SelectTrigger>
            <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
          {genre === 'Other' && (
            <div className="mt-2">
              <Input value={customGenre} onChange={e => setCustomGenre(e.target.value)} placeholder="Specify genre (e.g., Amapiano, Drill, Hyperpop)" className="bmg-focus-ring text-sm" maxLength={50} />
              {errors.customGenre && <p className="text-xs text-destructive mt-1">{errors.customGenre}</p>}
            </div>
          )}
          {errors.genre && <p className="text-xs text-destructive">{errors.genre}</p>}
        </div>

        {/* Rationale */}
        <div className="space-y-1.5">
          <Label htmlFor="rationale">Short Rationale * <span className="text-muted-foreground font-normal">({rationale.length}/300)</span></Label>
          <Textarea id="rationale" value={rationale} onChange={e => setRationale(e.target.value)} placeholder="Why should BMG look at this artist?" maxLength={300} rows={3} className="bmg-focus-ring resize-none" />
          {errors.rationale && <p className="text-xs text-destructive">{errors.rationale}</p>}
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full sm:w-auto" disabled={addSubmission.isPending}>
            {addSubmission.isPending ? 'Submitting…' : 'Submit Artist'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SubmitPage;
