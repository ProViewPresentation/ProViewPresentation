import { Check, Palette } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SlideView } from '../components/SlideView';
import { useToast } from '../components/UI';
import { themes } from '../lib/utils';

export default function Themes() {
  const { data, update } = useWorkspace();
  const { toast } = useToast();
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE ATMOSPHERE. A LOT OF CLARITY.</span>
          <h1>
            A feeling for <em>every gathering.</em>
          </h1>
          <p>Beautifully simple defaults. A clear canvas for your words.</p>
        </div>
        <span className="tag tag-green">
          <Palette size={14} /> Every theme, always free
        </span>
      </div>
      <div className="themes-grid">
        {themes.map((theme) => (
          <article className="theme-card" key={theme.id}>
            <SlideView
              slide={{
                id: theme.id,
                text: 'A little light.',
                subtitle: 'ROOM FOR WHAT REALLY MATTERS',
                fontSize: 62,
                theme: theme.id,
              }}
            />
            <div>
              <div>
                <h3>{theme.name}</h3>
                <p>{theme.description}</p>
              </div>
              <button
                className={
                  data.settings.defaultTheme === theme.id
                    ? 'button button-dark button-small'
                    : 'button button-outline button-small'
                }
                disabled={data.settings.defaultTheme === theme.id}
                onClick={() => {
                  update((previous) => ({
                    ...previous,
                    settings: { ...previous.settings, defaultTheme: theme.id },
                  }));
                  toast(`${theme.name} is your new default. Existing slides stay as they are.`);
                }}
              >
                {data.settings.defaultTheme === theme.id ? (
                  <>
                    <Check size={14} /> Your default
                  </>
                ) : (
                  'Make it your default'
                )}
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="theme-note">
        <Palette size={22} />
        <div>
          <h3>Make it a little more you.</h3>
          <p>
            Choose any theme or your own image in the service editor. Your default applies to new slides only,
            so the services you’ve already prepared stay just right.
          </p>
        </div>
      </div>
    </div>
  );
}
