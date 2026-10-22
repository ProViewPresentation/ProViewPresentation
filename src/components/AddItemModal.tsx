import { useState, type FormEvent } from 'react';
import { BookOpen, Image, Layers3, Music2, Plus, Search, Type, Video } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { ItemType, ServiceItem } from '../lib/types';
import { cn, makeSlides, songCredit, uid } from '../lib/utils';
import { EmptyState, FormField, Modal } from './UI';
import { ScriptureComposer } from './ScriptureComposer';
import { useMediaUrl } from '../lib/media';

function MediaChoice({
  url,
  type,
  name,
  onClick,
}: {
  url: string;
  type: 'image' | 'video';
  name: string;
  onClick: () => void;
}) {
  const src = useMediaUrl(url);
  return (
    <button className="media-choice" onClick={onClick}>
      {type === 'image' ? (
        <img src={src} alt="" />
      ) : (
        <span>
          <Video size={27} />
        </span>
      )}
      <strong>{name}</strong>
      <Plus size={16} />
    </button>
  );
}
export function AddItemModal({
  onClose,
  onAdd,
  live = false,
}: {
  onClose: () => void;
  onAdd: (item: ServiceItem) => void;
  live?: boolean;
}) {
  const { data } = useWorkspace();
  const [type, setType] = useState<ItemType>('song');
  const [search, setSearch] = useState('');
  const add = (item: ServiceItem) => {
    onAdd(item);
    onClose();
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title')).trim();
    const text = String(form.get('text')).trim();
    if (!title || !text) return;
    add({
      id: uid(),
      title,
      type,
      duration: Number(form.get('duration')) || 3,
      notes: String(form.get('notes') || ''),
      slides: makeSlides(
        text,
        data.settings.defaultTheme,
        data.settings.wordsPerSlide,
        data.settings.defaultFontSize,
      ).map((slide, index) => ({
        ...slide,
        label: type === 'sermon' ? `Point ${index + 1}` : `Slide ${index + 1}`,
      })),
    });
  };
  return (
    <Modal
      title={live ? 'A little room for the unexpected.' : 'Bring another moment into the mix.'}
      subtitle={
        live
          ? 'Added to this live session only. Your original stays untouched.'
          : 'Choose a song, a passage, or something of your own.'
      }
      onClose={onClose}
      wide={type === 'scripture'}
    >
      <div className="add-item-tabs" role="tablist" aria-label="Item type">
        {[
          { type: 'song', label: 'Song', icon: Music2 },
          { type: 'scripture', label: 'Scripture', icon: BookOpen },
          { type: 'announcement', label: 'Slide', icon: Type },
          { type: 'sermon', label: 'Sermon', icon: Layers3 },
          { type: 'media', label: 'Media', icon: Image },
        ].map((tab) => (
          <button
            key={tab.type}
            role="tab"
            aria-selected={type === tab.type}
            className={cn(type === tab.type && 'active')}
            onClick={() => setType(tab.type as ItemType)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      {type === 'song' ? (
        <div className="modal-fields">
          <div className="search-input">
            <Search size={17} />
            <input
              data-autofocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a song…"
              aria-label="Find song to add"
            />
          </div>
          <div className="library-pick-list">
            {data.songs
              .filter((song) => song.title.toLowerCase().includes(search.toLowerCase()))
              .map((song) => (
                <button
                  key={song.id}
                  onClick={() =>
                    add({
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
                  <span className="song-pick-icon">
                    <Music2 size={18} />
                  </span>
                  <span>
                    <strong>{song.title}</strong>
                    <small>{song.author}</small>
                  </span>
                  <Plus size={18} />
                </button>
              ))}
            {!data.songs.some((song) => song.title.toLowerCase().includes(search.toLowerCase())) && (
              <p className="search-empty">No songs found. Add one in your Song library.</p>
            )}
          </div>
        </div>
      ) : type === 'scripture' ? (
        <div className="modal-scripture">
          <ScriptureComposer onAdd={add} compact />
        </div>
      ) : type === 'media' ? (
        <div className="modal-fields">
          <div className="media-choice-grid">
            {data.media.map((media) => (
              <MediaChoice
                key={media.id}
                {...media}
                onClick={() =>
                  add({
                    id: uid(),
                    title: media.name,
                    type: 'media',
                    duration: 3,
                    slides: [
                      {
                        id: uid(),
                        text: '',
                        fontSize: 48,
                        theme: data.settings.defaultTheme,
                        backgroundUrl: media.url,
                        mediaType: media.type,
                        label: media.name,
                      },
                    ],
                  })
                }
              />
            ))}
          </div>
          {!data.media.length && (
            <EmptyState
              icon={Image}
              title="A little blank canvas."
              description="Upload an image or video in your Media library first."
            />
          )}
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="modal-fields">
            <FormField label={type === 'sermon' ? 'Message or collection title' : 'Slide title'}>
              <input
                data-autofocus
                name="title"
                required
                maxLength={120}
                placeholder={type === 'sermon' ? 'The way of love' : 'A warm welcome'}
              />
            </FormField>
            <FormField
              label={type === 'sermon' ? 'Sermon points or notes' : 'Your words'}
              hint="Separate sections with a blank line. Long text will flow across clean, readable slides."
            >
              <textarea
                name="text"
                rows={6}
                required
                maxLength={20000}
                placeholder={
                  type === 'sermon'
                    ? 'Love makes room.\n\nLove shows up.\n\nLove changes things.'
                    : 'There’s a place for you here.'
                }
              />
            </FormField>
            <div className="form-row">
              <FormField label="Time in the service (minutes)">
                <input
                  name="duration"
                  type="number"
                  min="1"
                  max="300"
                  defaultValue={type === 'sermon' ? 25 : 3}
                />
              </FormField>
              <FormField label="Private speaker note (optional)">
                <input name="notes" maxLength={500} placeholder="Only visible on stage view" />
              </FormField>
            </div>
          </div>
          <div className="modal-footer">
            <button className="button button-outline" type="button" onClick={onClose}>
              Not now
            </button>
            <button className="button button-dark" type="submit">
              <Plus size={16} /> Add to {live ? 'live session' : 'service'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
