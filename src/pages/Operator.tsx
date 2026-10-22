import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  EyeOff,
  GripVertical,
  Keyboard,
  Layers3,
  Maximize,
  Monitor,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Timer,
  Type,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { SlideView, ThemeSwatch } from '../components/SlideView';
import { AddItemModal } from '../components/AddItemModal';
import { EmptyState, FormField, IconButton, Logo, Modal, useToast } from '../components/UI';
import { itemIcons } from './ServiceEditor';
import type { LiveState, Service, ServiceItem, Slide } from '../lib/types';
import { cn, makeSlides, moveItem, themes } from '../lib/utils';
import { liveChannelName, outputUrl, publishLiveState, timeString } from '../lib/live';

export default function OperatorPage() {
  const { serviceId } = useParams();
  const { data } = useWorkspace();
  const service = data.services.find((value) => value.id === serviceId);
  if (!service)
    return (
      <div className="operator-not-found">
        <EmptyState
          icon={Monitor}
          title="Let’s find a service to present."
          description="This collection isn’t available. Choose a service from your workspace."
          action={
            <Link to="/workspace/services" className="button button-dark">
              Back to services <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    );
  return <OperatorSession key={service.id} service={service} />;
}
function OperatorSession({ service }: { service: Service }) {
  const { data } = useWorkspace();
  const { user } = useAuth();
  const sessionKey = `pv.operator.${user?.id}.${service.id}`;
  const [items, setItems] = useState<ServiceItem[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
      if (saved?.source === service.updatedAt && Array.isArray(saved.items)) return saved.items;
    } catch {
      /* Fresh session if the saved deck is incomplete. */
    }
    return structuredClone(service.items);
  });
  const [channel] = useState(() => {
    const key = `pv.channel.${user?.id}.${service.id}`;
    const previous = sessionStorage.getItem(key);
    const id = previous || crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
  });
  const [activeId, setActiveId] = useState(items[0]?.slides[0]?.id || '');
  const [isLive, setIsLive] = useState(false);
  const [black, setBlack] = useState(false);
  const [clear, setClear] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [countdownEnd, setCountdownEnd] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('5');
  const [now, setNow] = useState(Date.now());
  const [search, setSearch] = useState('');
  const [inspector, setInspector] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const { toast } = useToast();
  const flattened = useMemo(
    () =>
      items.flatMap((item) =>
        item.slides.map((slide) => ({ slide: { ...slide, notes: slide.notes || item.notes }, item })),
      ),
    [items],
  );
  const activeIndex = Math.max(
    0,
    flattened.findIndex((value) => value.slide.id === activeId),
  );
  const active = flattened[activeIndex];
  const next = flattened[activeIndex + 1];
  const currentItem = active?.item;
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef<LiveState>({
    active: null,
    next: null,
    serviceTitle: service.title,
    itemTitle: '',
    black: true,
    clear: false,
    isLive: false,
    startedAt: null,
    countdownEnd: null,
    updatedAt: Date.now(),
  });
  stateRef.current = {
    active: active?.slide || null,
    next: next?.slide || null,
    serviceTitle: service.title,
    itemTitle: active?.item.title || '',
    black,
    clear,
    isLive,
    startedAt,
    countdownEnd,
    updatedAt: now,
  };

  useEffect(() => {
    const broadcast =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(liveChannelName(channel)) : null;
    broadcastRef.current = broadcast;
    const heartbeat = setInterval(() => publishLiveState(channel, stateRef.current, broadcast), 2500);
    const close = () =>
      publishLiveState(channel, { ...stateRef.current, isLive: false, black: true }, broadcast);
    window.addEventListener('pagehide', close);
    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('pagehide', close);
      close();
      broadcast?.close();
      broadcastRef.current = null;
    };
  }, [channel]);
  useEffect(() => {
    publishLiveState(channel, stateRef.current, broadcastRef.current);
  }, [channel, activeId, items, isLive, black, clear, startedAt, countdownEnd]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({ source: service.updatedAt, items }));
    } catch {
      /* Master remains safe even if this session cannot be cached. */
    }
  }, [items, sessionKey, service.updatedAt]);
  const advance = (direction: number) => {
    const index = Math.min(flattened.length - 1, Math.max(0, activeIndex + direction));
    if (flattened[index]) setActiveId(flattened[index].slide.id);
  };
  const toggleLive = () => {
    if (!flattened.length) return;
    if (!isLive && !startedAt) setStartedAt(Date.now());
    setIsLive((value) => !value);
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        addOpen ||
        helpOpen ||
        resetOpen ||
        outputOpen
      )
        return;
      if (['BUTTON', 'A'].includes(target.tagName) && (event.key === ' ' || event.key === 'Enter')) return;
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        advance(1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        advance(-1);
      }
      if (event.key.toLowerCase() === 'b') setBlack((value) => !value);
      if (event.key.toLowerCase() === 'c') setClear((value) => !value);
      if (event.key.toLowerCase() === 'l') toggleLive();
      if (event.key === '?') setHelpOpen(true);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });
  const updateSlide = (changes: Partial<Slide>) => {
    if (!active) return;
    setItems((previous) =>
      previous.map((item) => ({
        ...item,
        slides: item.slides.map((slide) => (slide.id === active.slide.id ? { ...slide, ...changes } : slide)),
      })),
    );
  };
  const openOutput = (kind: 'output' | 'stage') => {
    publishLiveState(channel, stateRef.current, broadcastRef.current);
    const popup = window.open(
      outputUrl(kind, channel),
      `proview-${kind}-${channel}`,
      'popup,width=1280,height=720',
    );
    if (!popup) toast('Allow pop-ups for ProView, then open the display again.', 'error');
    else {
      popup.opener = null;
      toast(
        kind === 'stage'
          ? 'Stage view opened. Move it to your confidence monitor.'
          : 'Audience display opened. Move it to your projector.',
        'info',
      );
    }
  };
  const visibleItems = items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="operator-shell">
      <header className="operator-header">
        <div>
          <Link
            to={`/workspace/services/${service.id}`}
            className="operator-back"
            aria-label="Back to service editor"
          >
            <ArrowLeft size={19} />
          </Link>
          <Logo compact light link={false} />
          <div className="operator-service-title">
            <h1>{service.title}</h1>
            <span>LIVE OPERATOR WORKSPACE</span>
          </div>
        </div>
        <div className="operator-header-actions">
          <span className="operator-safe">
            <ShieldCheck size={15} /> Originals protected
          </span>
          <button className="operator-secondary" onClick={() => setOutputOpen(true)}>
            <Monitor size={16} /> Displays
          </button>
          <button
            className={cn('go-live-button', isLive && 'is-live')}
            onClick={toggleLive}
            disabled={!flattened.length}
          >
            {isLive ? <Pause size={15} fill="currentColor" /> : <Radio size={16} />}{' '}
            {isLive ? 'End live' : 'Go live'}
            {isLive && <span />}
          </button>
        </div>
      </header>
      <div className="operator-body">
        <aside className="operator-playlist">
          <div className="operator-list-heading">
            <span>SERVICE ORDER</span>
            <span>{items.length} ITEMS</span>
          </div>
          <div className="operator-search">
            <Search size={15} />
            <input
              aria-label="Search live service"
              placeholder="Find your next moment…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="operator-item-list">
            {visibleItems.map((item, index) => {
              const Icon = itemIcons[item.type];
              return (
                <div
                  draggable
                  onDragStart={(event) => {
                    setDragged(item.id);
                    event.dataTransfer.setData('text/plain', item.id);
                  }}
                  onDragEnd={() => setDragged(null)}
                  onDragOver={(event) => {
                    if (dragged) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragged)
                      setItems((previous) =>
                        moveItem(
                          previous,
                          previous.findIndex((value) => value.id === dragged),
                          previous.findIndex((value) => value.id === item.id),
                        ),
                      );
                    setDragged(null);
                  }}
                  key={item.id}
                  className={cn('operator-item', currentItem?.id === item.id && 'active')}
                >
                  <button
                    onClick={() => {
                      if (item.slides[0]) setActiveId(item.slides[0].id);
                    }}
                  >
                    <span className="operator-order">{String(index + 1).padStart(2, '0')}</span>
                    <Icon size={17} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {item.slides.length} slides · {item.duration} min
                      </small>
                    </span>
                    <GripVertical size={13} />
                  </button>
                  {currentItem?.id === item.id && (
                    <div className="operator-item-slides">
                      {item.slides.map((slide, i) => (
                        <button
                          key={slide.id}
                          className={active?.slide.id === slide.id ? 'active' : ''}
                          onClick={() => setActiveId(slide.id)}
                        >
                          <span>{i + 1}</span>
                          <strong>{slide.label || slide.text.split('\n')[0] || 'Media slide'}</strong>
                          {active?.slide.id === slide.id && <Play size={9} fill="currentColor" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {!visibleItems.length && (
              <div className="operator-empty-list">No items found. Make a little room below.</div>
            )}
          </div>
          <button className="operator-add" onClick={() => setAddOpen(true)}>
            <Plus size={17} /> Add a last-minute moment
          </button>
          <div className="operator-local-note">
            <ShieldCheck size={15} />
            <span>
              Make it work for the moment.
              <br />
              Your master service stays safe.
            </span>
          </div>
        </aside>
        <main className="operator-main">
          <div className="operator-main-heading">
            <div>
              <span className={cn('on-air-badge', isLive && 'active')}>
                <span />
                {isLive ? 'ON AIR' : 'READY WHEN YOU ARE'}
              </span>
              <span>{active?.item.title || 'Your live service'}</span>
            </div>
            <div>
              <IconButton
                label="Quick slide adjustments"
                icon={Settings2}
                onClick={() => setInspector(!inspector)}
                className={inspector ? 'active' : ''}
              />
              <IconButton label="Keyboard shortcuts" icon={Keyboard} onClick={() => setHelpOpen(true)} />
              <IconButton
                label="Reset session from original"
                icon={RotateCcw}
                onClick={() => setResetOpen(true)}
              />
            </div>
          </div>
          <div className={cn('operator-preview-layout', inspector && 'with-inspector')}>
            <div className="operator-screen-wrap">
              <div className="operator-screen">
                <SlideView slide={active?.slide || null} black={black} clear={clear} motion={isLive} />
                {black && (
                  <span className="operator-screen-label">
                    <Square size={15} /> Audience blacked out
                  </span>
                )}
                {clear && !black && (
                  <span className="operator-screen-label">
                    <EyeOff size={15} /> Text cleared
                  </span>
                )}
              </div>
              <div className="operator-screen-meta">
                <span>
                  <Monitor size={13} /> AUDIENCE PREVIEW · 16:9
                </span>
                <span>
                  {active ? activeIndex + 1 : 0} / {flattened.length}
                </span>
              </div>
              <div className="operator-controls">
                <div>
                  <button
                    className={cn('operator-control', black && 'active')}
                    onClick={() => setBlack(!black)}
                    aria-pressed={black}
                  >
                    <Square size={16} />
                    <span>Blackout</span>
                    <kbd>B</kbd>
                  </button>
                  <button
                    className={cn('operator-control', clear && 'active')}
                    onClick={() => setClear(!clear)}
                    aria-pressed={clear}
                  >
                    <Type size={17} />
                    <span>Clear text</span>
                    <kbd>C</kbd>
                  </button>
                </div>
                <div className="operator-navigation">
                  <button
                    aria-label="Previous slide"
                    onClick={() => advance(-1)}
                    disabled={activeIndex === 0}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => advance(1)} disabled={activeIndex >= flattened.length - 1}>
                    Next slide <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
            {inspector && active && (
              <aside className="operator-inspector">
                <div className="section-row">
                  <h3>A little live adjustment</h3>
                  <IconButton label="Close quick adjustments" icon={X} onClick={() => setInspector(false)} />
                </div>
                <FormField label="Your words">
                  <textarea
                    aria-label="Live slide text"
                    rows={4}
                    maxLength={10000}
                    value={active.slide.text}
                    onChange={(event) => updateSlide({ text: event.target.value })}
                  />
                </FormField>
                <FormField label={`Text size · ${active.slide.fontSize}px`}>
                  <input
                    aria-label="Live text size"
                    type="range"
                    min="24"
                    max="90"
                    value={active.slide.fontSize}
                    onChange={(event) => updateSlide({ fontSize: Number(event.target.value) })}
                  />
                </FormField>
                <div className="form-field">
                  <span>A change of background</span>
                  <div className="theme-picker">
                    {themes.map((theme) => (
                      <ThemeSwatch
                        key={theme.id}
                        theme={theme.id}
                        name={theme.name}
                        selected={!active.slide.backgroundUrl && active.slide.theme === theme.id}
                        onClick={() =>
                          updateSlide({ theme: theme.id, backgroundUrl: undefined, mediaType: undefined })
                        }
                      />
                    ))}
                  </div>
                </div>
                <FormField label="Your media">
                  <select
                    value={active.slide.backgroundUrl || ''}
                    onChange={(event) => {
                      const media = data.media.find((value) => value.url === event.target.value);
                      updateSlide({ backgroundUrl: media?.url, mediaType: media?.type });
                    }}
                  >
                    <option value="">Use theme background</option>
                    {data.media.map((media) => (
                      <option key={media.id} value={media.url}>
                        {media.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <button
                  className="operator-secondary"
                  onClick={() => {
                    const slides = makeSlides(
                      active.slide.text,
                      active.slide.theme,
                      data.settings.wordsPerSlide,
                      active.slide.fontSize,
                      active.slide.credit,
                    ).map((slide) => ({ ...active.slide, id: slide.id, text: slide.text }));
                    if (slides.length < 2) {
                      toast('Already comfortably spaced.', 'info');
                      return;
                    }
                    setItems((previous) =>
                      previous.map((item) =>
                        item.id === active.item.id
                          ? {
                              ...item,
                              slides: item.slides.flatMap((slide) =>
                                slide.id === active.slide.id ? slides : [slide],
                              ),
                            }
                          : item,
                      ),
                    );
                    setActiveId(slides[0].id);
                    toast(`Gently reflowed across ${slides.length} live slides.`);
                  }}
                >
                  <Sparkles size={15} /> Reflow this slide
                </button>
                <p>
                  <ShieldCheck size={13} /> Just this session. Never the original.
                </p>
              </aside>
            )}
          </div>
          <div className="operator-deck-heading">
            <span>{currentItem?.title || 'YOUR SLIDES'}</span>
            <span>Click a slide to {isLive ? 'send it live' : 'preview'}</span>
          </div>
          <div className="operator-slide-deck">
            {currentItem?.slides.map((slide, index) => (
              <button
                key={slide.id}
                className={cn('operator-slide-thumb', active?.slide.id === slide.id && 'active')}
                onClick={() => setActiveId(slide.id)}
              >
                <SlideView slide={slide} />
                <span>
                  <strong>{String(index + 1).padStart(2, '0')}</strong>
                  {slide.label || 'Slide'}
                  {active?.slide.id === slide.id && <Play size={9} fill="currentColor" />}
                </span>
              </button>
            ))}
          </div>
          <div className="operator-bottom-grid">
            <div className="operator-next">
              <div>
                <span className="operator-label">COMING UP NEXT</span>
                {next ? (
                  <>
                    <strong>{next.item.title}</strong>
                    <p>{next.slide.text.slice(0, 100) || next.slide.label}</p>
                  </>
                ) : (
                  <>
                    <strong>A meaningful finish.</strong>
                    <p>You’re at the end of this service.</p>
                  </>
                )}
              </div>
              <div>{next && <SlideView slide={next.slide} />}</div>
            </div>
            <div className="operator-clock">
              <Clock3 size={19} />
              <span className="operator-label">SERVICE TIME</span>
              <strong>{timeString(startedAt ? (now - startedAt) / 1000 : 0)}</strong>
              <span>{startedAt ? 'Since you first went live' : 'A fresh moment, waiting'}</span>
            </div>
            <div className="operator-countdown">
              <span className="operator-label">
                <Timer size={15} /> STAGE COUNTDOWN
              </span>
              {countdownEnd ? (
                <>
                  <strong>{timeString((countdownEnd - now) / 1000)}</strong>
                  <button onClick={() => setCountdownEnd(null)}>
                    Clear countdown <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <input
                      aria-label="Countdown in minutes"
                      type="number"
                      min="1"
                      max="180"
                      value={countdown}
                      onChange={(event) => setCountdown(event.target.value)}
                    />
                    <span>min</span>
                    <button
                      onClick={() =>
                        setCountdownEnd(
                          Date.now() + Math.max(1, Math.min(180, Number(countdown) || 5)) * 60000,
                        )
                      }
                      aria-label="Start stage countdown"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                  <span>A gentle cue for your speakers.</span>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <footer className="operator-footer">
        <span>
          <span className="green-dot" /> Your focus belongs in the room.
        </span>
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd> Navigate <span>·</span>
          <kbd>SPACE</kbd> Next slide <span>·</span>
          <kbd>?</kbd> Shortcuts
        </span>
        <span>
          <ShieldCheck size={13} /> Session-only edits
        </span>
      </footer>
      {addOpen && (
        <AddItemModal
          live
          onClose={() => setAddOpen(false)}
          onAdd={(item) => {
            setItems((previous) => [...previous, item]);
            if (item.slides[0]) setActiveId(item.slides[0].id);
            toast('A last-minute moment, right where you need it.');
          }}
        />
      )}
      {helpOpen && (
        <Modal
          title="A few keys to a calmer Sunday."
          subtitle="Shortcuts work when you’re not typing in a field or focused on a button."
          onClose={() => setHelpOpen(false)}
        >
          <div className="shortcuts-list">
            {[
              ['→ / Space', 'Next slide'],
              ['←', 'Previous slide'],
              ['B', 'Black out / restore the audience screen'],
              ['C', 'Clear / restore slide text'],
              ['L', 'Go live / end live'],
              ['?', 'Open these shortcuts'],
            ].map(([key, label]) => (
              <div key={key}>
                <span>{label}</span>
                <kbd>{key}</kbd>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {resetOpen && (
        <Modal
          title="Back to your original plan?"
          subtitle="Your live adjustments will be replaced by the saved service collection."
          onClose={() => setResetOpen(false)}
        >
          <div className="modal-fields">
            <p className="muted">The audience screen will go black until you’re ready to go live again.</p>
          </div>
          <div className="modal-footer">
            <button className="button button-outline" onClick={() => setResetOpen(false)}>
              Keep this session
            </button>
            <button
              className="button button-dark"
              onClick={() => {
                setItems(structuredClone(service.items));
                setActiveId(service.items[0]?.slides[0]?.id || '');
                setIsLive(false);
                setBlack(false);
                setClear(false);
                setStartedAt(null);
                setCountdownEnd(null);
                setResetOpen(false);
                toast('Your original plan, restored.');
              }}
            >
              <RotateCcw size={15} /> Reset session
            </button>
          </div>
        </Modal>
      )}
      {outputOpen && (
        <Modal
          title="A view for every part of the room."
          subtitle="Open a display window, move it onto the right screen, and enter fullscreen."
          onClose={() => setOutputOpen(false)}
        >
          <div className="output-options">
            <button onClick={() => openOutput('output')}>
              <span>
                <Monitor size={25} />
              </span>
              <div>
                <strong>Audience display</strong>
                <p>Your full-screen presentation, without the behind-the-scenes.</p>
              </div>
              <Maximize size={18} />
            </button>
            <button onClick={() => openOutput('stage')}>
              <span>
                <Layers3 size={25} />
              </span>
              <div>
                <strong>Stage & confidence view</strong>
                <p>The current slide, what’s next, private notes, and a countdown.</p>
              </div>
              <Maximize size={18} />
            </button>
            <div className="settings-info">
              <Monitor size={20} />
              <p>
                Displays sync in this browser on this device. Use an extended desktop for physical screens, or
                capture the audience window in OBS. Native NDI and cross-device stage links aren’t included in
                this release.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="button button-dark" onClick={() => setOutputOpen(false)}>
              All set <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
