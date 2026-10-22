import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  GripVertical,
  Image,
  Layers3,
  Monitor,
  MoreHorizontal,
  Music2,
  Plus,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SlideView, ThemeSwatch } from '../components/SlideView';
import { AddItemModal } from '../components/AddItemModal';
import { CreateServiceModal } from '../components/CreateServiceModal';
import { EmptyState, FormField, IconButton, Modal, useToast } from '../components/UI';
import type { ItemType, ServiceItem, Slide } from '../lib/types';
import { cn, formatDate, makeSlides, moveItem, themes, uid } from '../lib/utils';

export const itemIcons = {
  song: Music2,
  scripture: BookOpen,
  sermon: Layers3,
  media: Image,
  announcement: Type,
};
export const itemLabels: Record<ItemType, string> = {
  song: 'Song',
  scripture: 'Scripture',
  sermon: 'Sermon collection',
  media: 'Media',
  announcement: 'Announcement',
};
export default function ServiceEditor() {
  const { serviceId } = useParams();
  const { data, saveService } = useWorkspace();
  const service = data.services.find((item) => item.id === serviceId);
  const [selectedItem, setSelectedItem] = useState(service?.items[0]?.id || '');
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const [draggedSlide, setDraggedSlide] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  if (!service)
    return (
      <EmptyState
        icon={Layers3}
        title="This service has moved on."
        description="Head back to your collections to find another gathering."
        action={
          <Link className="button button-dark" to="/workspace/services">
            Back to services
          </Link>
        }
      />
    );
  const current = service.items.find((item) => item.id === selectedItem) || service.items[0];
  const slideIndex = current ? Math.min(selectedSlide, current.slides.length - 1) : 0;
  const slide = current?.slides[slideIndex];
  const setItems = (items: ServiceItem[]) => saveService({ ...service, items });
  const setItem = (item: ServiceItem) =>
    setItems(service.items.map((value) => (value.id === item.id ? item : value)));
  const setSlide = (changes: Partial<Slide>) => {
    if (current && slide)
      setItem({
        ...current,
        slides: current.slides.map((value, index) =>
          index === slideIndex ? { ...value, ...changes } : value,
        ),
      });
  };
  const select = (id: string) => {
    setSelectedItem(id);
    setSelectedSlide(0);
  };
  const reorder = (from: number, to: number) => setItems(moveItem(service.items, from, to));
  const addItem = (item: ServiceItem) => {
    setItems([...service.items, item]);
    select(item.id);
    toast('A new moment, in its place.');
  };
  const addSlide = () => {
    if (!current) return;
    const newSlide: Slide = {
      id: uid(),
      text: 'Your next thought.',
      theme: slide?.theme || service.theme,
      fontSize: data.settings.defaultFontSize,
      label: `Slide ${current.slides.length + 1}`,
    };
    setItem({ ...current, slides: [...current.slides, newSlide] });
    setSelectedSlide(current.slides.length);
  };
  return (
    <div className="service-editor-page">
      <Link className="back-link" to="/workspace/services">
        <ArrowLeft size={15} /> All services
      </Link>
      <div className="editor-heading">
        <div>
          <h1>
            {service.title}
            <button
              aria-label="Edit service details"
              className="icon-button"
              onClick={() => setDetailsOpen(true)}
            >
              <MoreHorizontal size={22} />
            </button>
          </h1>
          <div className="editor-meta">
            <span>
              <CalendarDays size={14} /> {formatDate(service.date)} · {service.time}
            </span>
            <span>
              <Layers3 size={14} /> {service.items.length} items
            </span>
            <span>
              <Clock3 size={14} /> {service.items.reduce((sum, item) => sum + item.duration, 0)} min
            </span>
          </div>
        </div>
        <button
          className="button button-dark"
          onClick={() => navigate(`/operator/${service.id}`)}
          disabled={!service.items.some((item) => item.slides.length)}
        >
          <Monitor size={17} /> Open live workspace <ArrowUp size={16} className="rotate-45" />
        </button>
      </div>
      <div className="service-builder">
        <aside className="builder-playlist">
          <div className="builder-panel-heading">
            <span>SERVICE ORDER</span>
            <span>{service.items.length} ITEMS</span>
          </div>
          <div className="builder-item-list">
            {service.items.map((item, index) => {
              const Icon = itemIcons[item.type];
              return (
                <div
                  draggable
                  key={item.id}
                  onDragStart={(event) => {
                    setDragged(item.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', item.id);
                  }}
                  onDragEnd={() => setDragged(null)}
                  onDragOver={(event) => {
                    if (dragged) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragged)
                      reorder(
                        service.items.findIndex((value) => value.id === dragged),
                        index,
                      );
                    setDragged(null);
                  }}
                  className={cn(
                    'builder-item',
                    current?.id === item.id && 'selected',
                    dragged === item.id && 'dragging',
                  )}
                >
                  <button className="builder-item-main" onClick={() => select(item.id)}>
                    <GripVertical size={13} className="drag-handle" />
                    <span className={`item-type-icon type-${item.type}`}>
                      <Icon size={16} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {item.slides.length} slides · {item.duration} min
                      </small>
                    </span>
                    <ChevronRight size={14} />
                  </button>
                  {current?.id === item.id && (
                    <div className="builder-item-nested">
                      {item.slides.map((value, i) => (
                        <button
                          key={value.id}
                          onClick={() => setSelectedSlide(i)}
                          className={slideIndex === i ? 'selected' : ''}
                        >
                          <span>{String(i + 1).padStart(2, '0')}</span>
                          {value.label || value.text.split('\n')[0] || 'Media slide'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button className="builder-add-item" onClick={() => setAddOpen(true)}>
            <Plus size={17} /> Add a service item
          </button>
          <div className="builder-playlist-note">
            <GripVertical size={14} /> Drag items into the order that feels right.
          </div>
        </aside>
        <div className="builder-main">
          {current && slide ? (
            <>
              <div className="builder-current-header">
                <span className={`item-type-icon type-${current.type}`}>
                  {(() => {
                    const Icon = itemIcons[current.type];
                    return <Icon size={17} />;
                  })()}
                </span>
                <input
                  aria-label="Service item title"
                  value={current.title}
                  maxLength={120}
                  onChange={(event) => setItem({ ...current, title: event.target.value })}
                />
                <div>
                  <IconButton
                    label="Move item up"
                    icon={ArrowUp}
                    disabled={service.items.indexOf(current) === 0}
                    onClick={() =>
                      reorder(service.items.indexOf(current), service.items.indexOf(current) - 1)
                    }
                  />
                  <IconButton
                    label="Move item down"
                    icon={ArrowDown}
                    disabled={service.items.indexOf(current) === service.items.length - 1}
                    onClick={() =>
                      reorder(service.items.indexOf(current), service.items.indexOf(current) + 1)
                    }
                  />
                  <IconButton
                    label="Duplicate service item"
                    icon={Copy}
                    onClick={() => {
                      const copy = {
                        ...structuredClone(current),
                        id: uid(),
                        title: `${current.title} (copy)`,
                        slides: current.slides.map((value) => ({ ...value, id: uid() })),
                      };
                      const items = [...service.items];
                      items.splice(service.items.indexOf(current) + 1, 0, copy);
                      setItems(items);
                      select(copy.id);
                    }}
                  />
                  <IconButton
                    label="Delete service item"
                    icon={Trash2}
                    onClick={() => setDeletingItem(true)}
                  />
                </div>
              </div>
              <div className="builder-edit-grid">
                <div className="builder-canvas">
                  <div className="builder-preview-label">
                    <span>
                      <span className="green-dot" /> SLIDE PREVIEW
                    </span>
                    <span>
                      16:9 · {slideIndex + 1} / {current.slides.length}
                    </span>
                  </div>
                  <SlideView slide={slide} />
                  <div className="builder-thumbnails">
                    {current.slides.map((value, index) => (
                      <button
                        draggable
                        onDragStart={(event) => {
                          event.stopPropagation();
                          setDraggedSlide(index);
                          event.dataTransfer.setData('text/plain', `slide:${index}`);
                        }}
                        onDragEnd={() => setDraggedSlide(null)}
                        onDragOver={(event) => {
                          if (draggedSlide !== null) event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (draggedSlide !== null) {
                            setItem({ ...current, slides: moveItem(current.slides, draggedSlide, index) });
                            setSelectedSlide(index);
                          }
                          setDraggedSlide(null);
                        }}
                        key={value.id}
                        className={slideIndex === index ? 'selected' : ''}
                        onClick={() => setSelectedSlide(index)}
                        aria-label={`Edit slide ${index + 1}`}
                      >
                        <SlideView slide={value} />
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </button>
                    ))}
                    <button className="add-slide-thumb" onClick={addSlide}>
                      <Plus size={20} />
                      <span>Add slide</span>
                    </button>
                  </div>
                  <div className="slide-editor">
                    <div className="section-row">
                      <h3>A little care for your words.</h3>
                      <IconButton
                        label="Delete this slide"
                        icon={Trash2}
                        disabled={current.slides.length <= 1}
                        onClick={() => {
                          setItem({
                            ...current,
                            slides: current.slides.filter((value) => value.id !== slide.id),
                          });
                          setSelectedSlide(Math.max(0, slideIndex - 1));
                        }}
                      />
                    </div>
                    <FormField label="Slide text">
                      <textarea
                        rows={4}
                        value={slide.text}
                        maxLength={10000}
                        placeholder="Your words, with a little room to breathe."
                        onChange={(event) => setSlide({ text: event.target.value })}
                      />
                    </FormField>
                    <div className="form-row">
                      <FormField label="Subtitle (optional)">
                        <input
                          value={slide.subtitle || ''}
                          maxLength={150}
                          onChange={(event) => setSlide({ subtitle: event.target.value })}
                          placeholder="A LITTLE CONTEXT"
                        />
                      </FormField>
                      <FormField label="Slide label">
                        <input
                          value={slide.label || ''}
                          maxLength={60}
                          onChange={(event) => setSlide({ label: event.target.value })}
                          placeholder="For your eyes only"
                        />
                      </FormField>
                    </div>
                    <FormField label="Private speaker notes">
                      <textarea
                        value={slide.notes || ''}
                        rows={2}
                        maxLength={3000}
                        onChange={(event) => setSlide({ notes: event.target.value })}
                        placeholder="A prompt, a reminder, a little encouragement. Only for the stage view."
                      />
                    </FormField>
                  </div>
                </div>
                <aside className="slide-inspector">
                  <span className="inspector-label">THE FINISHING TOUCHES</span>
                  <FormField label={`Text size · ${slide.fontSize}px`}>
                    <input
                      aria-label="Slide text size"
                      type="range"
                      min="24"
                      max="90"
                      value={slide.fontSize}
                      onChange={(event) => setSlide({ fontSize: Number(event.target.value) })}
                    />
                  </FormField>
                  <div className="form-field">
                    <span>Slide theme</span>
                    <div className="theme-picker">
                      {themes.map((theme) => (
                        <ThemeSwatch
                          key={theme.id}
                          theme={theme.id}
                          name={theme.name}
                          selected={!slide.backgroundUrl && theme.id === slide.theme}
                          onClick={() =>
                            setSlide({ theme: theme.id, backgroundUrl: undefined, mediaType: undefined })
                          }
                        />
                      ))}
                    </div>
                    <small>{themes.find((theme) => theme.id === slide.theme)?.name}</small>
                  </div>
                  <FormField label="Or, your own background">
                    <select
                      value={slide.backgroundUrl || ''}
                      onChange={(event) => {
                        const media = data.media.find((value) => value.url === event.target.value);
                        setSlide({ backgroundUrl: media?.url, mediaType: media?.type });
                      }}
                    >
                      <option value="">Use slide theme</option>
                      {data.media.map((media) => (
                        <option value={media.url} key={media.id}>
                          {media.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Item duration (minutes)">
                    <input
                      aria-label="Item duration in minutes"
                      type="number"
                      min="1"
                      max="300"
                      value={current.duration}
                      onChange={(event) =>
                        setItem({
                          ...current,
                          duration: Math.max(1, Math.min(300, Number(event.target.value) || 1)),
                        })
                      }
                    />
                  </FormField>
                  <div className="inspector-divider" />
                  <div className="reflow-info">
                    <Sparkles size={19} />
                    <h4>Let your words breathe.</h4>
                    <p>A long passage? Split this slide into clean, readable moments.</p>
                    <button
                      className="button button-outline button-small button-full"
                      onClick={() => {
                        const chunks = makeSlides(
                          slide.text,
                          slide.theme,
                          data.settings.wordsPerSlide,
                          slide.fontSize,
                          slide.credit,
                        ).map((value) => ({ ...slide, id: value.id, text: value.text }));
                        if (chunks.length < 2) {
                          toast('This slide already has a little room to breathe.', 'info');
                          return;
                        }
                        const slides = [...current.slides];
                        slides.splice(slideIndex, 1, ...chunks);
                        setItem({ ...current, slides });
                        toast(`One long thought, now ${chunks.length} readable slides.`);
                      }}
                    >
                      <Sparkles size={14} /> Smart reflow
                    </button>
                  </div>
                  <div className="autosave-note">
                    <Check size={14} /> Your changes save as you go.
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Layers3}
              title="Every good service starts somewhere."
              description="Add a welcome slide, a favourite song, or the words that will shape your gathering."
              action={
                <button className="button button-dark" onClick={() => setAddOpen(true)}>
                  <Plus size={16} /> Add your first item
                </button>
              }
            />
          )}
        </div>
      </div>
      {addOpen && <AddItemModal onClose={() => setAddOpen(false)} onAdd={addItem} />}
      {detailsOpen && <CreateServiceModal service={service} onClose={() => setDetailsOpen(false)} />}
      {deletingItem && current && (
        <Modal
          title="Remove this moment?"
          subtitle={`“${current.title}” and its ${current.slides.length} slides will leave this service.`}
          onClose={() => setDeletingItem(false)}
        >
          <div className="modal-fields">
            <p className="muted">Songs and media in your master library won’t be affected.</p>
          </div>
          <div className="modal-footer">
            <button className="button button-outline" onClick={() => setDeletingItem(false)}>
              Keep it
            </button>
            <button
              className="button button-danger"
              onClick={() => {
                setItems(service.items.filter((item) => item.id !== current.id));
                setSelectedSlide(0);
                setDeletingItem(false);
                toast('Item removed from this service.');
              }}
            >
              Remove item <Trash2 size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
