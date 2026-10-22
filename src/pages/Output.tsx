import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Maximize, Monitor, Radio, ShieldCheck } from 'lucide-react';
import { SlideView } from '../components/SlideView';
import { Logo } from '../components/UI';
import { liveChannelName, liveStorageKey, readLiveState, timeString } from '../lib/live';
import type { LiveState } from '../lib/types';
import { cn } from '../lib/utils';

export default function Output({ stage = false }: { stage?: boolean }) {
  const { channel = '' } = useParams();
  const [state, setState] = useState<LiveState | null>(() => readLiveState(channel));
  const [now, setNow] = useState(Date.now());
  const [fullscreenError, setFullscreenError] = useState('');
  useEffect(() => {
    document.title = stage ? 'ProView — Stage view' : 'ProView — Audience display';
    const receive = (value: unknown) => {
      if (value && typeof value === 'object' && 'updatedAt' in value && typeof value.updatedAt === 'number')
        setState(value as LiveState);
    };
    const broadcast =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(liveChannelName(channel)) : null;
    if (broadcast) broadcast.onmessage = (event) => receive(event.data);
    const onStorage = (event: StorageEvent) => {
      if (event.key === liveStorageKey(channel)) setState(readLiveState(channel));
    };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      broadcast?.close();
      window.removeEventListener('storage', onStorage);
      clearInterval(timer);
      document.title = 'ProView — Made for the moment.';
    };
  }, [channel, stage]);
  const stale = state ? now - state.updatedAt > 60000 : true;
  const live = state?.isLive && !stale;
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFullscreenError('');
    } catch {
      setFullscreenError('Fullscreen isn’t available here. Open this display directly in a browser tab.');
    }
  };
  if (!stage)
    return (
      <div className="audience-output">
        <div className="output-controls">
          <span>
            <Monitor size={15} /> AUDIENCE DISPLAY
          </span>
          <button onClick={fullscreen}>
            <Maximize size={16} /> Fullscreen
          </button>
          {fullscreenError && <span role="alert">{fullscreenError}</span>}
        </div>
        {state ? (
          <SlideView slide={state.active} clear={state.clear} black={state.black || !live} motion={!!live} />
        ) : (
          <div className="output-waiting">
            <Logo light link={false} />
            <h1>Your screen is ready.</h1>
            <p>
              Open the live workspace in this same browser and go live.
              <br />
              Your first moment will appear right here.
            </p>
          </div>
        )}
      </div>
    );
  return (
    <div className="stage-output">
      <header>
        <div>
          <Logo light compact link={false} />
          <span>{state?.serviceTitle || 'Stage & confidence view'}</span>
          <span className={cn('on-air-badge', live && 'active')}>
            <span />
            {live ? 'ON AIR' : stale ? 'WAITING FOR OPERATOR' : 'STANDING BY'}
          </span>
        </div>
        <div>
          <span className="stage-clock">
            {new Date(now).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <button onClick={fullscreen} aria-label="Enter fullscreen">
            <Maximize size={20} />
          </button>
        </div>
      </header>
      <main>
        <section className="stage-current">
          <div className="stage-section-label">
            <span>
              <Radio size={15} /> CURRENT MOMENT
            </span>
            <span>{state?.itemTitle}</span>
          </div>
          <SlideView
            slide={state?.active || null}
            clear={state?.clear}
            black={state?.black || !live}
            motion={!!live}
          />
          <div className="stage-notes">
            <span>
              <ShieldCheck size={16} /> JUST FOR YOU
            </span>
            <p>{state?.active?.notes || 'A deep breath. You’re ready. No private notes for this slide.'}</p>
          </div>
        </section>
        <aside>
          <div className="stage-section-label">COMING UP NEXT</div>
          <SlideView slide={state?.next || null} />
          <p className="stage-next-label">
            {state?.next?.text || 'A meaningful finish. Nothing queued after this.'}
          </p>
          <div
            className={cn(
              'stage-timer',
              !!state?.countdownEnd && state.countdownEnd - now <= 0 && 'timer-finished',
            )}
          >
            <span>{state?.countdownEnd ? 'YOUR COUNTDOWN' : 'SERVICE ELAPSED'}</span>
            <strong>
              {state?.countdownEnd
                ? timeString((state.countdownEnd - now) / 1000)
                : timeString(state?.startedAt ? (now - state.startedAt) / 1000 : 0)}
            </strong>
            <small>
              {state?.countdownEnd
                ? state.countdownEnd - now > 0
                  ? 'Room to breathe. Time to speak.'
                  : 'Your countdown has finished.'
                : 'A little perspective on the moment.'}
            </small>
          </div>
        </aside>
      </main>
      <footer>
        <span>
          <span className="green-dot" />{' '}
          {stale
            ? 'Waiting for this browser’s live workspace…'
            : 'Connected to the live workspace in this browser.'}
        </span>
        <span>THE VIEW IS YOURS. THE FOCUS IS THEM.</span>
      </footer>
      {fullscreenError && (
        <p className="stage-fullscreen-error" role="alert">
          {fullscreenError}
        </p>
      )}
    </div>
  );
}
