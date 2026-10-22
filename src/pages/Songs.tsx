import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, FileText, Music2, Pencil, Plus, Search, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { EmptyState, FormField, IconButton, Modal, useToast } from '../components/UI';
import { SelectServiceModal } from '../components/SelectServiceModal';
import { SlideView } from '../components/SlideView';
import type { ServiceItem, Song } from '../lib/types';
import { cn, errorMessage, makeSlides, songCredit, uid } from '../lib/utils';

function SongEditor({ song, onClose }: { song?: Song; onClose: () => void }) {
  const { data, update } = useWorkspace();
  const [lyrics, setLyrics] = useState(song?.lyrics || '');
  const [title, setTitle] = useState(song?.title || '');
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!title.trim() || !lyrics.trim()) return;
    const saved: Song = {
      id: song?.id || uid(),
      title: title.trim(),
      lyrics: lyrics.trim(),
      author: String(form.get('author')).trim(),
      copyright: String(form.get('copyright')).trim(),
      ccli: String(form.get('ccli')).trim(),
      tags: String(form.get('tags'))
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8),
    };
    update((previous) => ({
      ...previous,
      songs: song
        ? previous.songs.map((value) => (value.id === song.id ? saved : value))
        : [...previous.songs, saved],
    }));
    toast(song ? 'A little polish. Song updated.' : 'A new song, ready for the right moment.');
    onClose();
  };
  const preview = makeSlides(
    lyrics || 'Your words,\nwith room to breathe.',
    data.settings.defaultTheme,
    data.settings.wordsPerSlide,
    data.settings.defaultFontSize,
  )[0];
  return (
    <Modal
      title={song ? 'A little care for your song.' : 'Make room for a new song.'}
      subtitle="Lyrics and credits stay together, just as they should."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="song-editor-grid">
          <div className="song-editor-fields">
            <FormField label="Song title">
              <input
                data-autofocus
                required
                maxLength={150}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="A song worth singing"
              />
            </FormField>
            <div className="form-row">
              <FormField label="Writer / author">
                <input
                  name="author"
                  defaultValue={song?.author}
                  maxLength={200}
                  placeholder="Give credit where it’s due"
                />
              </FormField>
              <FormField label="CCLI song number (optional)">
                <input
                  name="ccli"
                  defaultValue={song?.ccli}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={20}
                  placeholder="e.g. 1234567"
                />
              </FormField>
            </div>
            <div className="lyrics-label">
              <span>Lyrics</span>
              <button className="text-link" type="button" onClick={() => inputRef.current?.click()}>
                <Upload size={13} /> Import .txt
              </button>
              <input
                type="file"
                accept=".txt,text/plain"
                ref={inputRef}
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 100000) {
                    toast('Choose a text file smaller than 100 KB.', 'error');
                    return;
                  }
                  try {
                    setLyrics((await file.text()).slice(0, 20000));
                    if (!title) setTitle(file.name.replace(/\.txt$/i, ''));
                  } catch (error) {
                    toast(errorMessage(error), 'error');
                  }
                  event.target.value = '';
                }}
              />
            </div>
            <textarea
              aria-label="Song lyrics"
              className="song-lyrics-input"
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              rows={12}
              maxLength={20000}
              placeholder={
                'A verse, a chorus, a little room to breathe.\n\nUse a blank line between sections.'
              }
              required
            />
            <FormField label="Copyright notice">
              <input
                name="copyright"
                defaultValue={song?.copyright}
                maxLength={250}
                placeholder="© Year Publisher, or Public domain"
              />
            </FormField>
            <FormField label="Tags (comma-separated)">
              <input
                name="tags"
                defaultValue={song?.tags.join(', ')}
                maxLength={200}
                placeholder="Worship, Grace, Hymn"
              />
            </FormField>
          </div>
          <aside className="song-editor-preview">
            <span className="eyebrow">A LITTLE LOOK AHEAD</span>
            <SlideView slide={preview} />
            <h3>Words that travel well.</h3>
            <p>
              Blank lines make natural sections. Longer verses gently flow across slides when you add the song
              to a service.
            </p>
            <div className="credit-note">
              <ShieldCheck size={20} />
              <strong>The credit stays with the song.</strong>
              <p>
                Your writer, copyright notice, song number, and church licence number are appended to every
                lyric slide.
              </p>
              <small>
                Credit display doesn’t grant permission or submit CCLI reports. Please check your church’s
                licences.
              </small>
            </div>
          </aside>
        </div>
        <div className="modal-footer">
          <button className="button button-outline" type="button" onClick={onClose}>
            Not now
          </button>
          <button type="submit" className="button button-dark">
            <Check size={16} /> {song ? 'Save song' : 'Add to the library'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Songs() {
  const { data, update } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<Song | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Song | null>(null);
  const [adding, setAdding] = useState<ServiceItem | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    const id = searchParams.get('song');
    if (id) {
      const song = data.songs.find((value) => value.id === id);
      if (song) setEditing(song);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, data.songs, setSearchParams]);
  const songs = data.songs
    .filter((song) =>
      `${song.title} ${song.author} ${song.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()),
    )
    .filter(
      (song) =>
        filter === 'all' ||
        (filter === 'hymns'
          ? song.tags.some((tag) => tag.toLowerCase() === 'hymn')
          : !song.id.startsWith('song-')),
    );
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORDS THAT BRING US TOGETHER</span>
          <h1>
            A song for <em>every moment.</em>
          </h1>
          <p>Your lyrics, your credits, your familiar favourites. All right here.</p>
        </div>
        <button className="button button-dark" onClick={() => setEditing('new')}>
          <Plus size={17} /> Add a song
        </button>
      </div>
      <div className="library-intro">
        <span>
          <Music2 size={27} strokeWidth={1.5} />
        </span>
        <div>
          <h3>A few old favourites to make you feel at home.</h3>
          <p>
            We’ve included four public-domain hymns. Add the songs your community loves, with the permissions
            you need.
          </p>
        </div>
        <span className="tag tag-green">READY TO SING</span>
      </div>
      <div className="page-toolbar">
        <div className="segmented-control">
          {[
            { id: 'all', label: 'All songs' },
            { id: 'hymns', label: 'Hymns' },
            { id: 'yours', label: 'Your additions' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={cn(filter === tab.id && 'active')}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search songs"
            placeholder="Find a song, writer, or tag…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      {songs.length ? (
        <div className="song-table">
          <div className="song-table-head">
            <span>SONG / WRITER</span>
            <span>A LITTLE CONTEXT</span>
            <span>SECTIONS</span>
            <span>READY WHEN YOU ARE</span>
          </div>
          {songs.map((song) => (
            <div className="song-row" key={song.id}>
              <button className="song-name" onClick={() => setEditing(song)}>
                <span className="song-row-icon">
                  <Music2 size={21} />
                </span>
                <span>
                  <strong>{song.title}</strong>
                  <small>{song.author || 'Your original song'}</small>
                </span>
              </button>
              <div className="song-tags">
                {song.tags.slice(0, 2).map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <span className="song-sections">
                <FileText size={14} /> {song.lyrics.split(/\n\s*\n/).length}
              </span>
              <div className="song-actions">
                <button
                  className="button button-outline button-small"
                  onClick={() =>
                    setAdding({
                      id: uid(),
                      title: song.title,
                      type: 'song',
                      duration: 5,
                      slides: makeSlides(
                        song.lyrics,
                        data.settings.defaultTheme,
                        data.settings.wordsPerSlide,
                        data.settings.defaultFontSize,
                        songCredit(song, data.settings.ccliLicense),
                      ),
                    })
                  }
                >
                  <Plus size={14} /> Add to service
                </button>
                <IconButton icon={Pencil} label={`Edit ${song.title}`} onClick={() => setEditing(song)} />
                <IconButton icon={Trash2} label={`Delete ${song.title}`} onClick={() => setDeleting(song)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Music2}
          title="A little quiet in this corner."
          description={
            search ? 'Try another title or writer.' : 'Add a favourite song and make this library your own.'
          }
          action={
            <button className="button button-dark" onClick={() => setEditing('new')}>
              <Plus size={16} /> Add a song
            </button>
          }
        />
      )}
      <div className="library-footnote">
        <ShieldCheck size={16} />
        <p>
          Thoughtful credits, not automatic licensing. Set your church’s CCLI licence number in Settings. Your
          team remains responsible for usage reports and permissions.
        </p>
      </div>
      {editing && (
        <SongEditor song={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      {adding && <SelectServiceModal item={adding} onClose={() => setAdding(null)} />}
      {deleting && (
        <Modal
          title="Let this song leave the library?"
          subtitle={`“${deleting.title}” will be removed from your song library.`}
          onClose={() => setDeleting(null)}
        >
          <div className="modal-fields">
            <p className="muted">Slides already added to services will stay right where they are.</p>
          </div>
          <div className="modal-footer">
            <button className="button button-outline" onClick={() => setDeleting(null)}>
              Keep it
            </button>
            <button
              className="button button-danger"
              onClick={() => {
                update((previous) => ({
                  ...previous,
                  songs: previous.songs.filter((song) => song.id !== deleting.id),
                }));
                setDeleting(null);
                toast('Song removed. Existing service slides are safe.');
              }}
            >
              <Trash2 size={16} /> Remove song
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
