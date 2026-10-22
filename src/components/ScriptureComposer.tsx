import { useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Plus, Search, Sparkles } from 'lucide-react';
import { findPassage, loadBible, translations, type Passage, type Translation } from '../lib/bible';
import { scripturePassages } from '../lib/seed';
import { useWorkspace } from '../context/WorkspaceContext';
import { ErrorNotice, FormField, Spinner } from './UI';
import { SlideView, ThemeSwatch } from './SlideView';
import { errorMessage, makeSlides, themes, uid } from '../lib/utils';
import type { ServiceItem, ThemeId } from '../lib/types';

export function ScriptureComposer({
  onAdd,
  compact = false,
}: {
  onAdd: (item: ServiceItem) => void;
  compact?: boolean;
}) {
  const { data } = useWorkspace();
  const [query, setQuery] = useState('Psalm 23');
  const [translation, setTranslation] = useState<Translation>('kjv');
  const [passage, setPassage] = useState<Passage>({
    reference: 'Psalm 23:1–6',
    translation: 'kjv',
    verses: scripturePassages[0].text.split('\n\n').map((text, index) => ({ text, number: index + 1 })),
  });
  const [words, setWords] = useState(data.settings.wordsPerSlide);
  const [theme, setTheme] = useState<ThemeId>(data.settings.defaultTheme);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(0);
  const slides = useMemo(
    () =>
      makeSlides(
        passage.verses.map((verse) => verse.text).join('\n\n'),
        theme,
        words,
        data.settings.defaultFontSize,
        `${passage.reference} · ${passage.translation.toUpperCase()}`,
      ),
    [passage, theme, words, data.settings.defaultFontSize],
  );
  const lookup = async (reference = query, version = translation) => {
    setBusy(true);
    setError('');
    try {
      const books = await loadBible(version);
      setPassage(findPassage(books, reference, version));
      setSelected(0);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };
  const search = (event: FormEvent) => {
    event.preventDefault();
    void lookup();
  };
  return (
    <div className={compact ? 'scripture-composer compact' : 'scripture-composer'}>
      <div className="scripture-lookup">
        <form onSubmit={search}>
          <FormField label="Find a passage">
            <div className="search-input">
              <Search size={17} />
              <input
                aria-label="Scripture reference"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="John 3:16–17"
                required
              />
            </div>
          </FormField>
          <FormField label="Translation">
            <select
              aria-label="Bible translation"
              value={translation}
              onChange={(event) => {
                const value = event.target.value as Translation;
                setTranslation(value);
                void lookup(query, value);
              }}
              disabled={busy}
            >
              {translations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.short} — {item.name}
                </option>
              ))}
            </select>
          </FormField>
          <button className="button button-dark" disabled={busy}>
            {busy ? (
              <Spinner label="Finding…" />
            ) : (
              <>
                <BookOpen size={16} /> Find passage
              </>
            )}
          </button>
        </form>
        <div className="scripture-suggestions">
          <span>A little inspiration:</span>
          {['Psalm 23', 'John 3:16–17', 'Philippians 4:6–7'].map((reference) => (
            <button
              disabled={busy}
              key={reference}
              onClick={() => {
                setQuery(reference);
                void lookup(reference);
              }}
            >
              {reference}
            </button>
          ))}
        </div>
        {error && <ErrorNotice>{error}</ErrorNotice>}
      </div>
      <div className="scripture-compose-grid">
        <section className="passage-card">
          <div className="section-row">
            <h3>{passage.reference}</h3>
            <span className="tag tag-green">{passage.translation.toUpperCase()}</span>
          </div>
          <div className="passage-verses">
            {passage.verses.map((verse) => (
              <p key={verse.number}>
                <sup>{verse.number}</sup>
                {verse.text}
              </p>
            ))}
          </div>
          <div className="passage-source">
            <BookOpen size={13} />{' '}
            {passage.translation === 'kjv' ? 'King James Version' : 'American Standard Version (1901)'} · 66
            books available
          </div>
        </section>
        <section className="scripture-preview">
          <div className="section-row">
            <span className="eyebrow">A LITTLE ROOM FOR EVERY WORD</span>
            <span className="muted">{slides.length} slides</span>
          </div>
          <SlideView slide={slides[Math.min(selected, slides.length - 1)] || null} />
          <div className="scripture-page-buttons">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                aria-label={`Preview scripture slide ${index + 1}`}
                aria-pressed={index === selected}
                className={index === selected ? 'active' : ''}
                onClick={() => setSelected(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="scripture-options">
            <FormField label={`Smart text flow · up to ${words} words per slide`}>
              <input
                aria-label="Words per scripture slide"
                type="range"
                min="12"
                max="60"
                step="2"
                value={words}
                onChange={(event) => {
                  setWords(Number(event.target.value));
                  setSelected(0);
                }}
              />
            </FormField>
            <div className="form-field">
              <span>A feeling for your words</span>
              <div className="theme-picker">
                {themes.map((item) => (
                  <ThemeSwatch
                    key={item.id}
                    theme={item.id}
                    name={item.name}
                    selected={theme === item.id}
                    onClick={() => setTheme(item.id)}
                  />
                ))}
              </div>
            </div>
            <p className="micro-note">
              <Sparkles size={13} /> Long verses gently flow across multiple slides.
            </p>
          </div>
          <button
            className="button button-dark button-full"
            disabled={busy || !slides.length}
            onClick={() =>
              onAdd({
                id: uid(),
                title: `${passage.reference} (${passage.translation.toUpperCase()})`,
                type: 'scripture',
                duration: 3,
                slides,
              })
            }
          >
            <Plus size={17} /> Add {slides.length} slides to a service
          </button>
        </section>
      </div>
    </div>
  );
}
