import { useRef, useState, type FormEvent } from 'react';
import {
  Check,
  Cloud,
  Download,
  Heart,
  LockKeyhole,
  Monitor,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { backendConfig, isWorkspace } from '../lib/backend';
import { errorMessage, themes } from '../lib/utils';
import type { ThemeId, WorkspaceData } from '../lib/types';
import { FormField, Modal, useToast } from '../components/UI';

export default function Settings() {
  const { user } = useAuth();
  const { data, update, status, retrySync } = useWorkspace();
  const [tab, setTab] = useState('church');
  const [restoring, setRestoring] = useState<WorkspaceData | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        ...(tab === 'church'
          ? {
              name: String(form.get('name')).trim(),
              churchName: String(form.get('church')).trim(),
              ccliLicense: String(form.get('ccli')).trim(),
            }
          : {
              defaultTheme: String(form.get('theme')) as ThemeId,
              defaultFontSize: Number(form.get('fontSize')),
              wordsPerSlide: Number(form.get('words')),
            }),
      },
    }));
    toast('The little details, taken care of.');
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proview-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup downloaded. Media files aren’t included — keep those originals too.', 'info');
  };
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE LITTLE DETAILS THAT MAKE IT YOURS</span>
          <h1>
            At home in <em>your workspace.</em>
          </h1>
          <p>A few thoughtful defaults. A little less to think about each week.</p>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[
            { id: 'church', icon: Heart, label: 'Your church' },
            { id: 'defaults', icon: SlidersHorizontal, label: 'Presentation defaults' },
            { id: 'access', icon: ShieldCheck, label: 'Workspace & access' },
            { id: 'data', icon: Download, label: 'Your data & backups' },
          ].map((item) => (
            <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="settings-panel">
          {tab === 'church' || tab === 'defaults' ? (
            <form onSubmit={save} key={tab}>
              <div className="settings-panel-header">
                <h2>{tab === 'church' ? 'Your people. Your place.' : 'Start from a good place.'}</h2>
                <p>
                  {tab === 'church'
                    ? 'Let’s make this workspace feel a little more like home.'
                    : 'These defaults apply to new slides. Existing services stay just as you prepared them.'}
                </p>
              </div>
              <div className="settings-fields">
                {tab === 'church' ? (
                  <>
                    <FormField label="Church or community name">
                      <input name="church" defaultValue={data.settings.churchName} required maxLength={100} />
                    </FormField>
                    <FormField label="Your name">
                      <input name="name" defaultValue={data.settings.name} required maxLength={80} />
                    </FormField>
                    <FormField label="Account email">
                      <input value={user?.email || ''} disabled />
                    </FormField>
                    <div className="settings-divider" />
                    <FormField
                      label="Your church’s CCLI licence number"
                      hint="Appended to new song slides alongside the credits you provide. This is your church licence, not an individual song number."
                    >
                      <input
                        name="ccli"
                        defaultValue={data.settings.ccliLicense}
                        maxLength={20}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g. 123456"
                      />
                    </FormField>
                    <div className="settings-info">
                      <ShieldCheck size={20} />
                      <p>
                        ProView displays credits; it doesn’t verify licences or submit CCLI usage reports.
                        Your church remains responsible for permissions and reporting.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <FormField label="Default slide theme">
                      <select name="theme" defaultValue={data.settings.defaultTheme}>
                        {themes.map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField
                      label="Default text size (px)"
                      hint="You can adjust individual slides whenever they need a little more space."
                    >
                      <input
                        name="fontSize"
                        type="number"
                        min="24"
                        max="90"
                        required
                        defaultValue={data.settings.defaultFontSize}
                      />
                    </FormField>
                    <FormField
                      label="Maximum words per slide"
                      hint="Smart reflow respects blank lines, then splits long text at word boundaries."
                    >
                      <input
                        name="words"
                        type="number"
                        min="12"
                        max="60"
                        required
                        defaultValue={data.settings.wordsPerSlide}
                      />
                    </FormField>
                    <div className="settings-info">
                      <Monitor size={21} />
                      <p>
                        All audience slides use a 16:9 canvas. Audience and stage outputs open in separate
                        browser windows — move them onto your displays and enter fullscreen.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="settings-panel-footer">
                <button className="button button-dark" type="submit">
                  Save the details <Check size={16} />
                </button>
              </div>
            </form>
          ) : tab === 'access' ? (
            <>
              <div className="settings-panel-header">
                <h2>A place for every part of the team.</h2>
                <p>Deep preparation and focused presentation, kept thoughtfully separate.</p>
              </div>
              <div className="settings-fields">
                <div className="access-role">
                  <span className="stat-icon sage">
                    <LockKeyhole size={22} />
                  </span>
                  <div>
                    <h3>Preparation workspace</h3>
                    <p>
                      Your authenticated owner account manages services, the song and media library, themes,
                      and defaults.
                    </p>
                    <span className="tag tag-green">WORKSPACE OWNER</span>
                  </div>
                </div>
                <div className="access-role">
                  <span className="stat-icon peach">
                    <Monitor size={22} />
                  </span>
                  <div>
                    <h3>Live operator workspace</h3>
                    <p>
                      The live deck works from a separate session copy. Micro-edits, added slides, and
                      background changes don’t write back to your master collection.
                    </p>
                    <span className="tag">SESSION-ONLY EDITS</span>
                  </div>
                </div>
                <div className="settings-info">
                  <ShieldCheck size={22} />
                  <p>
                    This release provides owner accounts and separate editing modes, not multi-user church
                    teams. Staff invitations and server-enforced team roles require backend support. Don’t
                    share your account credentials with volunteers.
                  </p>
                </div>
                <div className="backend-status">
                  <div>
                    <Cloud size={20} />
                    <strong>BreadBackend cloud workspace</strong>
                    <span className="tag">{status.toUpperCase()}</span>
                  </div>
                  <p>{backendConfig.baseUrl}</p>
                  {status === 'error' && (
                    <button className="button button-outline button-small" onClick={retrySync}>
                      Try cloud sync again <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="settings-panel-header">
                <h2>Your work is worth keeping.</h2>
                <p>A little backup now. A little peace of mind later.</p>
              </div>
              <div className="settings-fields">
                <div className="backup-option">
                  <span className="stat-icon sage">
                    <Download size={22} />
                  </span>
                  <div>
                    <h3>Take a copy with you</h3>
                    <p>
                      Export your services, songs, settings, and media references in one readable JSON file.
                      Account credentials are never included.
                    </p>
                    <button className="button button-outline" onClick={exportBackup}>
                      <Download size={16} /> Export workspace backup
                    </button>
                  </div>
                </div>
                <div className="backup-option">
                  <span className="stat-icon peach">
                    <Upload size={22} />
                  </span>
                  <div>
                    <h3>Pick up where you left off</h3>
                    <p>
                      Restore a ProView workspace backup to this cloud account. This replaces your saved
                      collections and settings, so export a copy first.
                    </p>
                    <button className="button button-outline" onClick={() => input.current?.click()}>
                      <Upload size={16} /> Restore a backup
                    </button>
                    <input
                      ref={input}
                      hidden
                      type="file"
                      accept=".json,application/json"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (!file) return;
                        try {
                          if (file.size > 25 * 1024 * 1024)
                            throw new Error('Please choose a backup smaller than 25 MB.');
                          const parsed: unknown = JSON.parse(await file.text());
                          if (!isWorkspace(parsed))
                            throw new Error(
                              'That doesn’t look like a valid ProView workspace backup. Nothing has been changed.',
                            );
                          const localMedia =
                            parsed.media.some((media) => media.url.startsWith('local:')) ||
                            parsed.services.some((service) =>
                              service.items.some((item) =>
                                item.slides.some((slide) => slide.backgroundUrl?.startsWith('local:')),
                              ),
                            );
                          if (localMedia)
                            throw new Error(
                              'This backup contains device-only media from the old demo. Upload the original files to your cloud library and remove local references before restoring it. Nothing has been changed.',
                            );
                          setRestoring(parsed);
                        } catch (error) {
                          toast(errorMessage(error), 'error');
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="settings-info">
                  <Cloud size={20} />
                  <p>
                    Backups include cloud media references, not file bytes. Your uploaded files remain on
                    BreadBackend and can be used from another device after signing in. Keep original media
                    files too. Workspace changes use last-write-wins, so avoid editing the same account on two
                    devices at once.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {restoring && (
        <Modal
          title="Make this backup your workspace?"
          subtitle="This replaces your current collections, songs, and settings."
          onClose={() => setRestoring(null)}
        >
          <div className="modal-fields">
            <div className="backup-summary">
              <span>
                <strong>{restoring.services.length}</strong> services
              </span>
              <span>
                <strong>{restoring.songs.length}</strong> songs
              </span>
              <span>
                <strong>{restoring.media.length}</strong> media references
              </span>
            </div>
            <p className="muted">
              This backup will be saved to your cloud account. Cloud media links depend on the original
              uploaded files still being available.
            </p>
          </div>
          <div className="modal-footer">
            <button className="button button-outline" onClick={() => setRestoring(null)}>
              Keep current workspace
            </button>
            <button
              className="button button-dark"
              onClick={() => {
                update(() => restoring);
                setRestoring(null);
                toast('Your workspace, back where it belongs.');
              }}
            >
              <Check size={16} /> Restore backup
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
