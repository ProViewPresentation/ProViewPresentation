import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Cloud,
  GripVertical,
  Heart,
  Image,
  Layers3,
  LayoutGrid,
  Menu,
  Monitor,
  MousePointer2,
  Music2,
  Play,
  Plus,
  Radio,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Logo, Accordion, CheckLine } from '../components/UI';
import { SlideView } from '../components/SlideView';
import { useAuth } from '../context/AuthContext';
import { welcomeSlide } from '../lib/seed';
import { cn } from '../lib/utils';
import type { Slide } from '../lib/types';

const previewItems = [
  { title: 'Welcome & gathering', icon: Image, detail: '2 slides · 5 min', slide: welcomeSlide },
  {
    title: 'Call to worship',
    icon: BookOpen,
    detail: '1 slide · 3 min',
    slide: {
      ...welcomeSlide,
      text: 'Come as you are.',
      subtitle: 'LET’S WORSHIP, TOGETHER',
      theme: 'sand' as const,
    },
  },
  {
    title: 'Amazing Grace',
    icon: Music2,
    detail: '6 slides · 5 min',
    slide: { ...welcomeSlide, text: 'Amazing grace!\nHow sweet the sound', subtitle: '', fontSize: 52 },
  },
  {
    title: 'Be Thou My Vision',
    icon: Music2,
    detail: '4 slides · 5 min',
    slide: {
      ...welcomeSlide,
      text: 'Be Thou my vision,\nO Lord of my heart.',
      subtitle: '',
      theme: 'forest' as const,
      fontSize: 52,
    },
  },
  {
    title: 'The way of love',
    icon: Layers3,
    detail: '4 slides · 25 min',
    slide: {
      ...welcomeSlide,
      text: 'The way of love.',
      subtitle: 'A LIFE SHAPED BY GRACE · WEEK 01',
      theme: 'sand' as const,
    },
  },
  {
    title: 'Life in our community',
    icon: Image,
    detail: '2 slides · 4 min',
    slide: {
      ...welcomeSlide,
      text: 'You belong here.',
      subtitle: 'LET’S DO LIFE TOGETHER',
      theme: 'lavender' as const,
    },
  },
];

function ProductPreview({ onExplore }: { onExplore: () => void }) {
  const [selected, setSelected] = useState(0);
  const active = previewItems[selected];
  return (
    <div className="product-preview">
      <div className="preview-top">
        <Logo compact link={false} />
        <div className="preview-workspace-name">
          Grace Community <ChevronDown size={10} />
        </div>
        <span className="preview-cloud">
          <Cloud size={11} /> All changes saved
        </span>
        <span className="preview-avatar">GC</span>
      </div>
      <div className="preview-body">
        <aside className="preview-rail">
          <LayoutGrid size={15} />
          <span className="active">
            <Layers3 size={15} />
          </span>
          <Music2 size={15} />
          <Image size={15} />
          <BookOpen size={15} />
          <Settings2 size={15} />
        </aside>
        <div className="preview-playlist">
          <div className="preview-eyebrow">
            YOUR SERVICE <Plus size={11} />
          </div>
          <h4>Sunday gathering</h4>
          <p>25 October · 10:00 am</p>
          <div className="preview-item-list">
            {previewItems.map((item, index) => (
              <button
                key={item.title}
                onClick={() => setSelected(index)}
                className={cn('preview-item', selected === index && 'selected')}
              >
                <GripVertical size={10} />
                <span className={cn('preview-type', `preview-type-${index}`)}>
                  <item.icon size={12} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                {index === selected && <ChevronRight size={10} />}
              </button>
            ))}
          </div>
          <div className="preview-add">
            <Plus size={12} /> Add a service item
          </div>
          <div className="preview-service-bottom">
            <span>6 items</span>
            <span>47 min</span>
          </div>
        </div>
        <div className="preview-deck">
          <div className="preview-deck-label">
            <span>
              <span className="green-dot" /> PREVIEW
            </span>
            <span>
              16:9 <Monitor size={11} />
            </span>
          </div>
          <SlideView slide={active.slide} />
          <div className="preview-slide-info">
            <span>{active.title}</span>
            <span>01 / 02</span>
          </div>
          <div className="preview-thumbnails">
            {[
              active.slide,
              { ...active.slide, text: 'Better, together.', subtitle: '', theme: 'forest' },
              { ...active.slide, text: 'You belong here.', subtitle: '', theme: 'sand' },
            ].map((slide, index) => (
              <div key={index} className={cn('preview-thumbnail', index === 0 && 'active')}>
                <SlideView slide={slide as Slide} />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
          <div className="preview-toolbar">
            <span>
              <Check size={11} /> Ready when you are.
            </span>
            <button onClick={onExplore}>
              <Play size={10} fill="currentColor" /> Go live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { enterDemo, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspace, setWorkspace] = useState<'prepare' | 'present'>('prepare');
  const openDemo = () => {
    if (!user) enterDemo();
    navigate('/workspace');
  };
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };
  return (
    <div className="landing">
      <header className="site-header container">
        <Logo />
        <nav className={cn('site-nav', menuOpen && 'open')} aria-label="Main navigation">
          <button onClick={() => scrollTo('features')}>The good stuff</button>
          <button onClick={() => scrollTo('how-it-works')}>How it works</button>
          <button onClick={() => scrollTo('why-free')}>
            Why it’s free <Heart size={13} />
          </button>
        </nav>
        <div className="nav-actions">
          <Link to={user ? '/workspace' : '/login'} className="login-link">
            {user ? 'My workspace' : 'Log in'}
          </Link>
          <Link className="button button-dark button-small" to="/signup">
            Get started free <ArrowUpRight size={16} />
          </Link>
          <button
            className="mobile-menu icon-button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-spark">
                <Sparkles size={13} />
              </span>{' '}
              MADE FOR THE MOMENTS THAT MATTER
            </div>
            <h1>
              Less distraction.
              <br />
              More <em>connection.</em>
            </h1>
            <p className="hero-description">
              Bring your service to life, not your tech to-do list.
              <br className="desktop-br" /> Lyrics, scripture, and every moment in between —
              <br className="desktop-br" /> in one beautifully simple, completely free place.
            </p>
            <div className="hero-actions">
              <Link className="button button-dark" to="/signup">
                Start creating for free <ArrowUpRight size={18} />
              </Link>
              <button className="button button-plain" onClick={openDemo}>
                <CirclePlay size={20} /> Take a look around
              </button>
            </div>
            <div className="hero-assurance">
              <CheckLine>No credit card</CheckLine>
              <span>·</span>
              <CheckLine>No downloads</CheckLine>
              <span>·</span>
              <CheckLine>Just your message</CheckLine>
            </div>
            <div className="hero-note">
              <span className="note-line" />
              <span>
                A little less behind-the-scenes.
                <br />
                <strong>A little more in the moment.</strong>
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-top">
              <span className="visual-label">SUNDAY, SORTED.</span>
              <span className="visual-dots">✦</span>
            </div>
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <ProductPreview onExplore={openDemo} />
            <div className="ready-card">
              <span className="ready-icon">
                <Check size={18} />
              </span>
              <span>
                <strong>A deep breath. You’re ready.</strong>
                <small>Everything in its place. Everyone in the moment.</small>
              </span>
              <span className="ready-spark">✧</span>
            </div>
            <div className="visual-caption">
              <span className="green-dot" /> Thoughtfully built for your Sunday.
            </div>
          </div>
        </section>
        <section className="benefits-bar container" aria-label="ProView at a glance">
          <div>
            <span className="benefit-icon">
              <Heart size={20} />
            </span>
            <p>
              <strong>Free. Really, truly free.</strong>
              <span>No plans. No limits on possibility.</span>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <Users size={20} />
            </span>
            <p>
              <strong>Made for your whole team</strong>
              <span>From first-time volunteers to pros.</span>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <Zap size={20} />
            </span>
            <p>
              <strong>Less setup. More Sunday.</strong>
              <span>Open your browser. You’re home.</span>
            </p>
          </div>
        </section>
        <section id="features" className="feature-section container section-space">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SIMPLICITY IS A BEAUTIFUL THING</span>
              <h2>
                Everything you need.
                <br />
                <em>Nothing in the way.</em>
              </h2>
            </div>
            <p>
              A thoughtful home for your whole service.
              <br />
              Not a hundred tools. Just the right ones.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-sage">
              <div className="feature-card-top">
                <span className="feature-icon">
                  <Layers3 size={22} />
                </span>
                <span className="feature-number">01 / ORGANIZE</span>
              </div>
              <h3>One service. All together.</h3>
              <p>
                Songs, sermon points, and that last-minute announcement. A place for everything, in the order
                you need it.
              </p>
              <div className="feature-ui service-mini">
                <div>
                  <span className="mini-color peach">
                    <Image size={15} />
                  </span>
                  <strong>Welcome, everyone.</strong>
                  <span>01</span>
                </div>
                <div>
                  <GripVertical size={14} />
                  <span className="mini-color green">
                    <Music2 size={15} />
                  </span>
                  <strong>Amazing Grace</strong>
                  <span>02</span>
                </div>
                <div>
                  <span className="mini-color lilac">
                    <Layers3 size={15} />
                  </span>
                  <strong>A message of hope</strong>
                  <ChevronDown size={13} />
                </div>
                <div className="nested-mini">
                  <span /> A heart that welcomes
                </div>
                <span className="mini-cursor">
                  <MousePointer2 size={20} fill="currentColor" />
                  <b>All in good order</b>
                </span>
              </div>
            </article>
            <article className="feature-card feature-peach">
              <div className="feature-card-top">
                <span className="feature-icon">
                  <BookOpen size={22} />
                </span>
                <span className="feature-number">02 / FIND YOUR WORDS</span>
              </div>
              <h3>Scripture. Right on cue.</h3>
              <p>
                Find a passage, choose your flow, and let the words breathe. Clean, readable slides in just a
                few clicks.
              </p>
              <div className="feature-ui scripture-mini">
                <div className="mini-search">
                  <BookOpen size={13} />
                  <span>Psalm 23</span>
                  <span>
                    KJV <ChevronDown size={10} />
                  </span>
                </div>
                <div className="mini-scripture-slide">
                  <span>PSALM 23:1</span>
                  <p>
                    “The LORD is my shepherd;
                    <br />I shall not want.”
                  </p>
                  <span className="mini-page-dots">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
                <div className="mini-auto">
                  <Sparkles size={12} /> A little space for every word.
                </div>
              </div>
            </article>
            <article className="feature-card feature-lilac">
              <div className="feature-card-top">
                <span className="feature-icon">
                  <Settings2 size={22} />
                </span>
                <span className="feature-number">03 / STAY IN THE MOMENT</span>
              </div>
              <h3>A small edit. A big relief.</h3>
              <p>
                A typo? A change of plans? Make live adjustments without touching your originals. You’ve got
                this.
              </p>
              <div className="feature-ui edit-mini">
                <div className="mini-edit-heading">
                  <span>
                    <Settings2 size={13} /> Quick adjustments
                  </span>
                  <span>LIVE</span>
                </div>
                <div className="mini-density">
                  <span>Text size</span>
                  <b>48 px</b>
                </div>
                <div className="mini-slider">
                  <span />
                </div>
                <div className="mini-density">
                  <span>Slide background</span>
                  <span>First light</span>
                </div>
                <div className="mini-swatches">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="mini-safe">
                  <ShieldCheck size={12} /> Your master slides stay safe.
                </div>
              </div>
            </article>
          </div>
          <button className="text-link feature-explore" onClick={openDemo}>
            Meet your new Sunday sidekick <ArrowRight size={17} />
          </button>
        </section>
        <section id="how-it-works" className="workflow-section">
          <div className="container workflow-grid">
            <div className="workflow-copy">
              <span className="eyebrow">A PLACE TO PREPARE. A PLACE TO PRESENT.</span>
              <h2>
                Two workspaces.
                <br />
                One <em>shared purpose.</em>
              </h2>
              <p>
                Room for the details during the week.
                <br />
                Clarity for the moments that count on Sunday.
              </p>
              <div className="workflow-tabs" role="tablist" aria-label="Workspace preview">
                <button
                  role="tab"
                  aria-selected={workspace === 'prepare'}
                  className={cn(workspace === 'prepare' && 'active')}
                  onClick={() => setWorkspace('prepare')}
                >
                  <Layers3 size={16} /> Prepare
                </button>
                <button
                  role="tab"
                  aria-selected={workspace === 'present'}
                  className={cn(workspace === 'present' && 'active')}
                  onClick={() => setWorkspace('present')}
                >
                  <Radio size={16} /> Present
                </button>
              </div>
              <div className="workflow-tab-content" role="tabpanel">
                <h3>
                  {workspace === 'prepare'
                    ? 'Make a little room for inspiration.'
                    : 'Be present. Not preoccupied.'}
                </h3>
                <p>
                  {workspace === 'prepare'
                    ? 'Build your service, gather your media, and give every slide a little care. Your admin workspace keeps the big picture beautifully organized.'
                    : 'A focused operator deck puts every slide within reach. Move through your service, make a quick edit, and keep your eyes on what matters.'}
                </p>
                <ul>
                  {(workspace === 'prepare'
                    ? [
                        'Your songs and media, all in one home',
                        'Drag, drop, and bring the service together',
                        'Beautiful defaults. Your own finishing touch.',
                      ]
                    : [
                        'One click to the next meaningful moment',
                        'A separate view for the people on stage',
                        'Live edits that leave your originals untouched',
                      ]
                  ).map((text) => (
                    <li key={text}>
                      <Check size={16} />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="text-link" onClick={openDemo}>
                Find your flow <ArrowUpRight size={17} />
              </button>
            </div>
            <div className={cn('workflow-art', workspace === 'present' && 'present-art')}>
              <div className="workflow-art-header">
                <span className="workflow-avatar">G</span>
                <span>
                  <strong>Sunday gathering</strong>
                  <small>Something good is coming together.</small>
                </span>
                <span className="workflow-ready">
                  <Check size={12} /> {workspace === 'prepare' ? 'All set' : 'Live'}
                </span>
              </div>
              {workspace === 'prepare' ? (
                <>
                  <div className="workflow-list">
                    {previewItems.slice(0, 4).map((item, i) => (
                      <div key={item.title}>
                        <GripVertical size={16} />
                        <span className={`workflow-item-icon color-${i}`}>
                          <item.icon size={18} />
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.detail}</small>
                        </span>
                        <ChevronRight size={16} />
                      </div>
                    ))}
                  </div>
                  <div className="workflow-sermon">
                    <div>
                      <Layers3 size={18} />
                      <strong>The way of love</strong>
                      <span>4 slides</span>
                    </div>
                    <div className="workflow-sermon-slides">
                      {['The way of love.', 'Love makes room.', 'Love shows up.'].map((text) => (
                        <SlideView
                          key={text}
                          slide={{ ...welcomeSlide, text, theme: 'sand', subtitle: 'A LIFE SHAPED BY GRACE' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="workflow-footer">
                    <Cloud size={14} /> A thoughtful plan. A peaceful Sunday.
                  </div>
                </>
              ) : (
                <>
                  <div className="workflow-live-preview">
                    <SlideView slide={welcomeSlide} />
                    <span className="live-indicator">
                      <span /> ON AIR
                    </span>
                  </div>
                  <div className="workflow-stage">
                    <Monitor size={20} />
                    <div>
                      <small>NEXT UP</small>
                      <strong>Better, together.</strong>
                    </div>
                    <span>10:04</span>
                  </div>
                  <div className="workflow-live-controls">
                    <span>
                      <ShieldCheck size={15} /> Master slides protected
                    </span>
                    <button onClick={openDemo}>
                      Open operator <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}
              <div className="workflow-sticker">
                <span>Less clicking.</span>
                <em>More connecting.</em>
                <svg viewBox="0 0 100 25" aria-hidden="true">
                  <path
                    d="M3 17C23 8 63 2 94 11M12 23C38 17 70 13 98 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>
        <section id="why-free" className="free-section container section-space">
          <div className="free-note">
            <span className="hand-heart">
              <Heart size={32} strokeWidth={1.3} />
            </span>
            <span className="eyebrow">GOOD TOOLS. OPEN DOORS.</span>
            <h2>
              Your calling isn’t a business.
              <br />
              <em>Your software shouldn’t feel like one.</em>
            </h2>
            <p>
              We believe every church deserves a beautiful way to share its message.
              <br />
              Big congregation or small gathering, a full team or just you.
              <br />
              ProView is free to use. No subscriptions. No “unlock the good stuff.”
            </p>
            <div className="free-pills">
              <span>
                <Check size={14} /> Every workspace
              </span>
              <span>
                <Check size={14} /> Every theme
              </span>
              <span>
                <Check size={14} /> Every meaningful moment
              </span>
            </div>
          </div>
        </section>
        <section className="faq-section container">
          <div>
            <span className="eyebrow">A FEW THINGS YOU MIGHT BE WONDERING</span>
            <h2>
              Glad you <em>asked.</em>
            </h2>
            <p>A little clarity before you get started.</p>
          </div>
          <div className="faq-list">
            <Accordion title="Wait, is it really free?">
              Yes. ProView has no subscriptions, paid tiers, or credit-card requirement. An account gives you
              a cloud workspace; the local demo lets you explore immediately. Media uploads are limited to 50
              MB per file by the backend.
            </Accordion>
            <Accordion title="Do I need to install anything?">
              No. ProView runs in a modern browser. Open the audience display in a second window and move it
              onto your projector. The local demo stores your service in this browser, so you can return to it
              later.
            </Accordion>
            <Accordion title="Can our volunteers make changes during a service?">
              Absolutely. The operator can adjust text, swap a background, reflow a long passage, or add a
              last-minute slide. These edits apply to the live session, not your original service or song
              library.
            </Accordion>
            <Accordion title="What about stage displays and streaming?">
              ProView includes audience and confidence-monitor windows that sync within the same browser. You
              can capture an audience window in streaming software such as OBS. Native NDI output and secure
              cross-device stage links require a separate broadcast or relay integration and are not included
              in this browser release.
            </Accordion>
            <Accordion title="Does ProView handle song licensing?">
              ProView displays the credits and CCLI licence number you enter on your lyric slides. It doesn’t
              purchase licences, verify rights, or submit usage reports to CCLI. Your church remains
              responsible for permission and reporting. Included hymn lyrics are public-domain examples.
            </Accordion>
          </div>
        </section>
        <section className="cta-section container">
          <div className="cta-decoration" aria-hidden="true">
            ✦
          </div>
          <span className="eyebrow">YOUR NEXT SUNDAY STARTS HERE</span>
          <h2>
            A little less tech.
            <br />
            <em>A lot more together.</em>
          </h2>
          <p>Make room for what really matters.</p>
          <Link to="/signup" className="button button-lime">
            Let’s get your church set up <ArrowUpRight size={18} />
          </Link>
          <span className="cta-footnote">Free to use. Easy to love. Made for you.</span>
        </section>
      </main>
      <footer className="site-footer container">
        <div className="footer-main">
          <div>
            <Logo />
            <p>
              Made for the moment.
              <br />
              Built for your ministry.
            </p>
          </div>
          <div className="footer-links">
            <button onClick={() => scrollTo('features')}>The good stuff</button>
            <button onClick={openDemo}>Explore the demo</button>
            <Link to="/login">Log in</Link>
            <Link to="/signup">
              Create an account <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ProView. A little good, freely given.</span>
          <span>
            Built with purpose. Shared with <Heart size={12} />.
          </span>
        </div>
      </footer>
    </div>
  );
}
