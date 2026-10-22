import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Layers3 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { ServiceItem } from '../lib/types';
import { formatDate, uid } from '../lib/utils';
import { EmptyState, Modal, useToast } from './UI';

export function SelectServiceModal({ item, onClose }: { item: ServiceItem; onClose: () => void }) {
  const { data, saveService } = useWorkspace();
  const [selected, setSelected] = useState(data.services[0]?.id || '');
  const { toast } = useToast();
  const add = () => {
    const service = data.services.find((value) => value.id === selected);
    if (!service) return;
    const copy = { ...item, id: uid(), slides: item.slides.map((slide) => ({ ...slide, id: uid() })) };
    saveService({ ...service, items: [...service.items, copy] });
    toast(`“${item.title}” added to ${service.title}.`);
    onClose();
  };
  return (
    <Modal
      title="Give it a place in your service."
      subtitle={`Add “${item.title}” · ${item.slides.length} slides`}
      onClose={onClose}
    >
      <div className="service-select-list">
        {data.services.length ? (
          data.services.map((service) => (
            <button
              key={service.id}
              className={selected === service.id ? 'selected' : ''}
              onClick={() => setSelected(service.id)}
            >
              <span className="select-service-icon">
                <Layers3 size={19} />
              </span>
              <span>
                <strong>{service.title}</strong>
                <small>
                  {formatDate(service.date)} · {service.items.length} items
                </small>
              </span>
              <span className="radio-check">{selected === service.id && <Check size={13} />}</span>
            </button>
          ))
        ) : (
          <EmptyState
            icon={Layers3}
            title="First, make a little room."
            description="Create a service collection, then add your slides."
            action={
              <Link onClick={onClose} to="/workspace/services" className="button button-dark">
                Go to services <ArrowRight size={16} />
              </Link>
            }
          />
        )}
      </div>
      {data.services.length > 0 && (
        <div className="modal-footer">
          <button className="button button-outline" onClick={onClose}>
            Not now
          </button>
          <button className="button button-dark" onClick={add}>
            Add to service <ArrowRight size={16} />
          </button>
        </div>
      )}
    </Modal>
  );
}
