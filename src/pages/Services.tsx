import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Copy,
  Layers3,
  ListFilter,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { CreateServiceModal } from '../components/CreateServiceModal';
import { SlideView } from '../components/SlideView';
import { EmptyState, IconButton, Modal, useToast } from '../components/UI';
import { formatDate, uid } from '../lib/utils';
import type { Service } from '../lib/types';

export default function Services() {
  const { data, update, saveService } = useWorkspace();
  const [create, setCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [deleting, setDeleting] = useState<Service | null>(null);
  const { toast } = useToast();
  const services = data.services
    .filter((service) => service.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : sort === 'updated'
          ? b.updatedAt.localeCompare(a.updatedAt)
          : `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    );
  const duplicate = (service: Service) => {
    const copy = structuredClone(service);
    copy.id = uid();
    copy.title += ' (copy)';
    copy.updatedAt = new Date().toISOString();
    copy.items = copy.items.map((item) => ({
      ...item,
      id: uid(),
      slides: item.slides.map((slide) => ({ ...slide, id: uid() })),
    }));
    saveService(copy);
    toast('A fresh copy, ready to make your own.');
  };
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A PLACE FOR EVERY GATHERING</span>
          <h1>
            Services, <em>in good order.</em>
          </h1>
          <p>Bring the pieces together. Leave a little room for the unexpected.</p>
        </div>
        <button className="button button-dark" onClick={() => setCreate(true)}>
          <Plus size={17} /> Create a service
        </button>
      </div>
      <div className="page-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search services"
            placeholder="Find a service…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span className="item-count">
          {services.length} {services.length === 1 ? 'collection' : 'collections'}
        </span>
        <label className="sort-select">
          <ListFilter size={16} />
          <select value={sort} aria-label="Sort services" onChange={(event) => setSort(event.target.value)}>
            <option value="date">Service date</option>
            <option value="updated">Recently edited</option>
            <option value="title">Name A–Z</option>
          </select>
        </label>
      </div>
      {services.length ? (
        <div className="services-grid">
          {services.map((service) => (
            <article className="service-card" key={service.id}>
              <Link className="service-cover" to={`/workspace/services/${service.id}`}>
                <SlideView
                  slide={{
                    id: service.id,
                    text: service.title,
                    theme: service.theme,
                    fontSize: 56,
                    subtitle: 'A LITTLE ROOM FOR SOMETHING GOOD',
                  }}
                />
                <span className="service-cover-date">
                  <CalendarDays size={12} /> {formatDate(service.date)}
                </span>
              </Link>
              <div className="service-card-content">
                <span className="tag tag-green">In preparation</span>
                <h2>
                  <Link to={`/workspace/services/${service.id}`}>{service.title}</Link>
                </h2>
                <p>{service.description || 'A fresh collection for your next gathering.'}</p>
                <div className="service-card-meta">
                  <span>
                    <Layers3 size={14} /> {service.items.length} items
                  </span>
                  <span>
                    <Clock3 size={14} /> {service.items.reduce((total, item) => total + item.duration, 0)} min
                  </span>
                  <span>{service.time}</span>
                </div>
                <div className="service-card-footer">
                  <Link className="text-link" to={`/workspace/services/${service.id}`}>
                    Open collection <ArrowUpRight size={15} />
                  </Link>
                  <div>
                    <IconButton
                      label={`Duplicate ${service.title}`}
                      icon={Copy}
                      onClick={() => duplicate(service)}
                    />
                    <IconButton
                      label={`Delete ${service.title}`}
                      icon={Trash2}
                      onClick={() => setDeleting(service)}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
          <button className="new-service-card" onClick={() => setCreate(true)}>
            <span>
              <Plus size={24} />
            </span>
            <h3>Your next meaningful moment</h3>
            <p>Give it a little space to grow.</p>
            <strong>
              Create a service <ArrowUpRight size={15} />
            </strong>
          </button>
        </div>
      ) : (
        <EmptyState
          icon={Layers3}
          title={search ? 'No services by that name.' : 'Your first gathering is waiting.'}
          description={
            search
              ? 'Try another word, or start a new collection.'
              : 'Create a service and start bringing your ideas together.'
          }
          action={
            <button className="button button-dark" onClick={() => setCreate(true)}>
              Create a service <Plus size={16} />
            </button>
          }
        />
      )}
      {create && <CreateServiceModal onClose={() => setCreate(false)} />}
      {deleting && (
        <Modal
          title="Let this collection go?"
          subtitle={`“${deleting.title}” will be removed from your workspace.`}
          onClose={() => setDeleting(null)}
        >
          <div className="modal-fields">
            <p className="muted">
              Your song and media libraries won’t be affected. This can’t be undone, so export a backup in
              Settings if you’d like to keep a copy.
            </p>
          </div>
          <div className="modal-footer">
            <button className="button button-outline" onClick={() => setDeleting(null)}>
              Keep it
            </button>
            <button
              className="button button-danger"
              onClick={() => {
                update((previous) => ({
                  ...previous,
                  services: previous.services.filter((service) => service.id !== deleting.id),
                }));
                setDeleting(null);
                toast('Collection removed. Your library is safe.');
              }}
            >
              <Trash2 size={16} /> Delete collection
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
