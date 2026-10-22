import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { FormField, Modal, useToast } from './UI';
import { useWorkspace } from '../context/WorkspaceContext';
import { themes, uid } from '../lib/utils';
import type { Service, ThemeId } from '../lib/types';
import { ThemeSwatch } from './SlideView';

export function CreateServiceModal({ onClose, service }: { onClose: () => void; service?: Service }) {
  const { data, saveService } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeId>(service?.theme || data.settings.defaultTheme);
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + ((7 - today.getDay()) % 7));
  const date = [
    nextSunday.getFullYear(),
    String(nextSunday.getMonth() + 1).padStart(2, '0'),
    String(nextSunday.getDate()).padStart(2, '0'),
  ].join('-');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title')).trim();
    if (!title) return;
    const id = service?.id || uid();
    saveService({
      id,
      title,
      date: String(form.get('date')),
      time: String(form.get('time')),
      description: String(form.get('description')).trim(),
      theme,
      items: service?.items || [],
      updatedAt: new Date().toISOString(),
    });
    toast(service ? 'Service details updated.' : 'A fresh service, ready for your ideas.');
    onClose();
    if (!service) navigate(`/workspace/services/${id}`);
  };
  return (
    <Modal
      title={service ? 'The details matter.' : 'Something good starts here.'}
      subtitle={
        service
          ? 'Give your service a little finishing touch.'
          : 'A fresh collection for your next gathering.'
      }
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-fields">
          <FormField label="Service name">
            <input
              data-autofocus
              name="title"
              defaultValue={service?.title}
              placeholder="Sunday gathering"
              required
              maxLength={100}
            />
          </FormField>
          <div className="form-row">
            <FormField label="Date">
              <input name="date" type="date" defaultValue={service?.date || date} required />
            </FormField>
            <FormField label="Time">
              <input name="time" type="time" defaultValue={service?.time || '10:00'} required />
            </FormField>
          </div>
          <FormField label="A little context (optional)">
            <textarea
              name="description"
              defaultValue={service?.description}
              placeholder="What’s the heart behind this gathering?"
              rows={3}
              maxLength={500}
            />
          </FormField>
          <div className="form-field">
            <span>Collection cover</span>
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
        </div>
        <div className="modal-footer">
          <button className="button button-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-dark" type="submit">
            {service ? 'Save changes' : 'Create service'}
            {service ? <Check size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </form>
    </Modal>
  );
}
