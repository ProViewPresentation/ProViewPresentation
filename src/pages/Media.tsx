import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Image as ImageIcon, Plus, Search, Trash2, UploadCloud, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { deleteCloudFile, uploadCloudFile } from '../lib/backend';
import { removeLocalFile, saveLocalFile, useMediaUrl } from '../lib/media';
import type { Media as MediaType, ServiceItem } from '../lib/types';
import { cn, errorMessage, formatSize, uid } from '../lib/utils';
import { EmptyState, IconButton, Modal, Spinner, useToast } from '../components/UI';
import { SelectServiceModal } from '../components/SelectServiceModal';

function MediaThumb({ media, full = false }: { media: MediaType; full?: boolean }) {
  const src = useMediaUrl(media.url);
  return media.type === 'image' ? (
    <img src={src} alt={media.name} loading="lazy" />
  ) : (
    <video src={src} controls={full} muted={!full} playsInline preload="metadata" />
  );
}
export default function MediaLibrary() {
  const { user } = useAuth();
  const { data, update } = useWorkspace();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<MediaType | null>(null);
  const [deleting, setDeleting] = useState<MediaType | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [adding, setAdding] = useState<ServiceItem | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const upload = async (files: File[]) => {
    if (busy) return;
    setBusy(true);
    let success = 0;
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (
        !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'].includes(file.type)
      ) {
        toast(`“${file.name}” isn’t supported. Choose JPG, PNG, WebP, GIF, MP4, or WebM.`, 'error');
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast(`“${file.name}” is too large. The limit is 50 MB per file.`, 'error');
        continue;
      }
      setProgress(`Adding ${index + 1} of ${files.length}…`);
      const id = uid();
      try {
        let url: string, filename: string | undefined;
        if (user?.mode === 'cloud') {
          const result = await uploadCloudFile(file);
          url = result.url;
          filename = result.filename;
        } else {
          await saveLocalFile(id, file);
          url = `local:${id}`;
        }
        const media: MediaType = {
          id,
          name: file.name,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url,
          filename,
          size: file.size,
          createdAt: new Date().toISOString(),
        };
        update((previous) => ({ ...previous, media: [...previous.media, media] }));
        success++;
      } catch (error) {
        toast(errorMessage(error), 'error');
      }
    }
    setBusy(false);
    setProgress('');
    if (success)
      toast(`${success === 1 ? 'A little inspiration' : `${success} new moments`}, added to your library.`);
  };
  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    void upload(files);
    event.target.value = '';
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    void upload(Array.from(event.dataTransfer.files));
  };
  const remove = async () => {
    if (!deleting || deleteBusy) return;
    const inUse = data.services.some((service) =>
      service.items.some((item) => item.slides.some((slide) => slide.backgroundUrl === deleting.url)),
    );
    if (inUse) {
      toast('This media is used in a service. Remove it from those slides first.', 'error');
      setDeleting(null);
      return;
    }
    setDeleteBusy(true);
    try {
      if (deleting.filename && user?.mode === 'cloud') await deleteCloudFile(deleting.filename);
      else if (deleting.url.startsWith('local:')) await removeLocalFile(deleting.id);
      update((previous) => ({
        ...previous,
        media: previous.media.filter((media) => media.id !== deleting.id),
      }));
      setDeleting(null);
      toast('Media removed from your library.');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setDeleteBusy(false);
    }
  };
  const media = data.media.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || item.type === filter),
  );
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A FEELING. A FAMILIAR FACE. A LITTLE LIGHT.</span>
          <h1>
            Make it <em>feel like you.</em>
          </h1>
          <p>Your photos and videos, ready for the moments they belong to.</p>
        </div>
        <button className="button button-dark" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? (
            <Spinner label={progress} />
          ) : (
            <>
              <Plus size={17} /> Upload media
            </>
          )}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        onChange={onFiles}
        hidden
      />
      <button
        disabled={busy}
        className={cn('media-dropzone', dragOver && 'drag-over')}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => input.current?.click()}
      >
        <span className="upload-icon">
          <UploadCloud size={29} strokeWidth={1.4} />
        </span>
        <strong>{busy ? progress : 'Drop a little inspiration here.'}</strong>
        <p>
          Drag in your images and videos, or <span>browse your files.</span>
        </p>
        <small>JPG, PNG, WebP, GIF, MP4, WebM · Up to 50 MB per file</small>
      </button>
      <div className="page-toolbar">
        <div className="segmented-control">
          {[
            { id: 'all', title: 'All media' },
            { id: 'image', title: 'Images' },
            { id: 'video', title: 'Videos' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={filter === tab.id ? 'active' : ''}
              onClick={() => setFilter(tab.id)}
            >
              {tab.title}
            </button>
          ))}
        </div>
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search media"
            placeholder="Find a familiar moment…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      {media.length ? (
        <div className="media-grid">
          {media.map((item) => (
            <article className="media-card" key={item.id}>
              <button className="media-thumbnail" onClick={() => setSelected(item)}>
                <MediaThumb media={item} />
                <span className="media-type">
                  {item.type === 'image' ? <ImageIcon size={13} /> : <Video size={13} />}
                  {item.type}
                </span>
              </button>
              <div className="media-details">
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.size ? formatSize(item.size) : 'Included with a little love'} ·{' '}
                    {item.type === 'image' ? 'Image' : 'Video'}
                  </small>
                </div>
                <IconButton label={`Delete ${item.name}`} icon={Trash2} onClick={() => setDeleting(item)} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="Room for something beautiful."
          description={
            search
              ? 'Try another name, or add a new file.'
              : 'Your images and videos will feel right at home here.'
          }
        />
      )}
      <div className="library-footnote">
        <ImageIcon size={16} />
        <p>
          {user?.mode === 'demo'
            ? 'Demo uploads are saved in this browser, not in the cloud. Clearing browser data removes them.'
            : 'Cloud uploads may have publicly accessible URLs. Only upload media you have permission to share. Avoid private or sensitive recordings.'}{' '}
          Video backgrounds loop silently; use the media preview for audio playback.
        </p>
      </div>
      {selected && (
        <Modal
          title={selected.name}
          subtitle={selected.size ? formatSize(selected.size) : 'First light — included background'}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="media-full-preview">
            <MediaThumb media={selected} full />
          </div>
          <div className="modal-footer">
            <button className="button button-outline" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              className="button button-dark"
              onClick={() => {
                setAdding({
                  id: uid(),
                  title: selected.name,
                  type: 'media',
                  duration: 3,
                  slides: [
                    {
                      id: uid(),
                      text: '',
                      theme: data.settings.defaultTheme,
                      fontSize: 48,
                      backgroundUrl: selected.url,
                      mediaType: selected.type,
                      label: selected.name,
                    },
                  ],
                });
                setSelected(null);
              }}
            >
              <Plus size={16} /> Add to a service
            </button>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Make a little room?"
          subtitle={`Remove “${deleting.name}” from your library?`}
          onClose={() => {
            if (!deleteBusy) setDeleting(null);
          }}
        >
          <div className="modal-fields">
            <p className="muted">
              This also deletes your uploaded file. Media used in an existing service must be removed from its
              slides first.
            </p>
          </div>
          <div className="modal-footer">
            <button disabled={deleteBusy} className="button button-outline" onClick={() => setDeleting(null)}>
              Keep it
            </button>
            <button disabled={deleteBusy} className="button button-danger" onClick={remove}>
              {deleteBusy ? (
                <Spinner label="Removing…" />
              ) : (
                <>
                  <Trash2 size={16} /> Remove media
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
      {adding && <SelectServiceModal item={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}
