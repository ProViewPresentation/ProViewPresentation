import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  Image,
  Layers3,
  Monitor,
  Music2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { CreateServiceModal } from '../components/CreateServiceModal';
import { SlideView } from '../components/SlideView';
import { EmptyState } from '../components/UI';
import { formatDate } from '../lib/utils';

export default function Overview() {
  const { data } = useWorkspace();
  const [create, setCreate] = useState(false);
  const sorted = [...data.services].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const upcoming = sorted[0];
  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <span className="green-dot" /> A LITTLE PREPARATION. A MEANINGFUL SUNDAY.
          </span>
          <h1>
            Good to see you, <em>{data.settings.name.split(' ')[0]}.</em>
          </h1>
          <p>Let’s make room for something good.</p>
        </div>
        <button className="button button-dark" onClick={() => setCreate(true)}>
          <Plus size={17} /> Create a service
        </button>
      </div>
      <div className="overview-stats">
        {[
          {
            label: 'Services taking shape',
            value: data.services.length,
            icon: Layers3,
            path: '/workspace/services',
            color: 'sage',
          },
          {
            label: 'Songs ready to sing',
            value: data.songs.length,
            icon: Music2,
            path: '/workspace/songs',
            color: 'peach',
          },
          {
            label: 'Moments in your media',
            value: data.media.length,
            icon: Image,
            path: '/workspace/media',
            color: 'lilac',
          },
        ].map((stat) => (
          <Link className="stat-card" to={stat.path} key={stat.label}>
            <span className={`stat-icon ${stat.color}`}>
              <stat.icon size={22} />
            </span>
            <span>
              <strong>{stat.value.toString().padStart(2, '0')}</strong>
              <small>{stat.label}</small>
            </span>
            <ArrowUpRight size={19} />
          </Link>
        ))}
      </div>
      <div className="overview-main-grid">
        <section className="upcoming-section">
          <div className="section-row">
            <h2>Coming together next</h2>
            <Link className="text-link" to="/workspace/services">
              All services <ArrowRight size={15} />
            </Link>
          </div>
          {upcoming ? (
            <div className="upcoming-card">
              <div className="upcoming-image">
                <SlideView
                  slide={{
                    id: 'cover',
                    text: 'Welcome home.',
                    subtitle: 'THERE’S A PLACE FOR YOU HERE',
                    theme: upcoming.theme,
                    fontSize: 62,
                  }}
                />
                <span className="upcoming-tag">
                  <span className="green-dot" /> YOUR NEXT GATHERING
                </span>
                <div className="date-badge">
                  <span>{formatDate(upcoming.date, { month: 'short' }).toUpperCase()}</span>
                  <strong>{formatDate(upcoming.date, { day: '2-digit' })}</strong>
                  <span>{formatDate(upcoming.date, { weekday: 'short' })}</span>
                </div>
              </div>
              <div className="upcoming-content">
                <div className="upcoming-meta">
                  <span>
                    <CalendarDays size={14} /> {formatDate(upcoming.date)} · {upcoming.time}
                  </span>
                  <span className="tag tag-green">In preparation</span>
                </div>
                <h2>{upcoming.title}</h2>
                <p>{upcoming.description || 'A fresh space for a meaningful gathering.'}</p>
                <div className="upcoming-bottom">
                  <span>
                    <Layers3 size={14} /> {upcoming.items.length} items <span>·</span>
                    <Clock3 size={14} /> {upcoming.items.reduce((sum, item) => sum + item.duration, 0)} min
                  </span>
                  <Link className="button button-dark button-small" to={`/workspace/services/${upcoming.id}`}>
                    Open service <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Your next gathering starts here."
              description="Create a service and give your ideas a place to come together."
              action={
                <button className="button button-dark" onClick={() => setCreate(true)}>
                  Create a service <Plus size={16} />
                </button>
              }
            />
          )}
        </section>
        <aside className="overview-side">
          <div className="section-row">
            <h2>A little head start</h2>
            <Sparkles size={18} />
          </div>
          <div className="quickstart-card">
            <span className="quickstart-illustration">
              <Layers3 size={31} strokeWidth={1.4} />
              <span>✧</span>
            </span>
            <h3>Your Sunday, simplified.</h3>
            <p>A few little steps. A whole lot of peace of mind.</p>
            <Link to="/workspace/services">
              <span className={data.services.length ? 'step-done' : ''}>
                {data.services.length ? <Check size={13} /> : '1'}
              </span>
              <div>
                <strong>Bring your service together</strong>
                <small>Songs, scripture, every little moment.</small>
              </div>
              <ChevronRight size={16} />
            </Link>
            <Link to="/workspace/media">
              <span className={data.media.length > 1 ? 'step-done' : ''}>
                {data.media.length > 1 ? <Check size={13} /> : '2'}
              </span>
              <div>
                <strong>Add a personal touch</strong>
                <small>A photo. A video. A familiar feeling.</small>
              </div>
              <ChevronRight size={16} />
            </Link>
            <Link to={upcoming ? `/operator/${upcoming.id}` : '/workspace/services'}>
              <span>3</span>
              <div>
                <strong>Find your flow</strong>
                <small>Give the live workspace a little try.</small>
              </div>
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="kindness-note">
            <Heart size={19} />
            <p>
              Behind every great service
              <br />
              is someone like <em>you.</em>
            </p>
            <span>THANK YOU FOR SHOWING UP.</span>
          </div>
        </aside>
      </div>
      <section className="quick-tools">
        <div className="section-row">
          <h2>Good things, close at hand</h2>
          <span>The little tools that make a big difference.</span>
        </div>
        <div>
          {[
            {
              icon: Music2,
              title: 'A song for the moment',
              description: 'Find your words in the song library.',
              path: '/workspace/songs',
              color: 'peach',
            },
            {
              icon: BookOpen,
              title: 'Let the Word speak',
              description: 'Beautifully spaced scripture slides.',
              path: '/workspace/scripture',
              color: 'sage',
            },
            {
              icon: Monitor,
              title: 'Practice makes peaceful',
              description: 'Get comfortable in the operator deck.',
              path: upcoming ? `/operator/${upcoming.id}` : '/workspace/services',
              color: 'lilac',
            },
          ].map((tool) => (
            <Link key={tool.title} to={tool.path}>
              <span className={`stat-icon ${tool.color}`}>
                <tool.icon size={22} />
              </span>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <ArrowUpRight size={19} />
            </Link>
          ))}
        </div>
      </section>
      {create && <CreateServiceModal onClose={() => setCreate(false)} />}
    </div>
  );
}
