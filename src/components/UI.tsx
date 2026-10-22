import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCircle2, ChevronDown, Loader2, X, AlertCircle, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Logo({
  light = false,
  compact = false,
  link = true,
}: {
  light?: boolean;
  compact?: boolean;
  link?: boolean;
}) {
  const content = (
    <>
      <span className="brand-mark">
        <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path
            d="M8 6h13c7 0 11 5 11 11S28 28 21 28h-7v-6h7c3 0 5-2 5-5s-2-5-5-5h-7v18H8V6Z"
            fill="currentColor"
          />
          <path d="m17 14 7 4-7 4v-8Z" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span>
          ProView<span className="brand-period">.</span>
        </span>
      )}
    </>
  );
  return link ? (
    <Link className={cn('brand', light && 'brand-light')} to="/" aria-label="ProView home">
      {content}
    </Link>
  ) : (
    <div className={cn('brand', light && 'brand-light')}>{content}</div>
  );
}
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <span className="spinner-label" role="status">
      <Loader2 size={18} className="spin" />
      {label}
    </span>
  );
}
export function PageLoader() {
  return (
    <div className="page-loader">
      <Logo link={false} />
      <Spinner label="Getting things ready…" />
    </div>
  );
}
export function IconButton({
  label,
  icon: Icon,
  onClick,
  className,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn('icon-button', className)}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={18} />
    </button>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (root) root.inert = true;
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex="0"]',
        ) || [],
      );
    const target = ref.current?.querySelector<HTMLElement>('[data-autofocus]') || focusable()[0];
    target?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
      if (root) root.inert = false;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cn('modal', wide && 'modal-wide')}
      >
        <div className="modal-heading">
          <div>
            <h2 id={id}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton label="Close dialog" icon={X} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <div className="error-notice" role="alert">
      <AlertCircle size={18} />
      <span>{children}</span>
    </div>
  );
}
export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const id = useId();
  const controlId = `${id}-control`;
  const hintId = `${id}-hint`;
  const bindControl = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (!isValidElement<Record<string, unknown>>(node)) return node;
      if (typeof node.type === 'string' && ['input', 'textarea', 'select'].includes(node.type)) {
        return cloneElement(node, { id: controlId, ...(hint ? { 'aria-describedby': hintId } : {}) });
      }
      return node.props.children
        ? cloneElement(node, undefined, bindControl(node.props.children as ReactNode))
        : node;
    });
  return (
    <div className="form-field">
      <label htmlFor={controlId}>{label}</label>
      {bindControl(children)}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}
export function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={cn('accordion', open && 'open')}>
      <button aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {title}
        <ChevronDown size={20} />
      </button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
export function CheckLine({ children }: { children: ReactNode }) {
  return (
    <span className="check-line">
      <Check size={14} />
      {children}
    </span>
  );
}

type ToastValue = { toast: (message: string, type?: 'success' | 'error' | 'info') => void };
const ToastContext = createContext<ToastValue>({ toast: () => {} });
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<{ id: number; message: string; type: string }[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const toast: ToastValue['toast'] = (message, type = 'success') => {
    const id = ++nextId.current;
    setMessages((previous) => [...previous.slice(-2), { id, message, type }]);
    timers.current.push(
      setTimeout(() => setMessages((previous) => previous.filter((item) => item.id !== id)), 5500),
    );
  };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {messages.map((item) => (
          <div className={cn('toast', `toast-${item.type}`)} key={item.id}>
            {item.type === 'error' ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
            <span>{item.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setMessages((previous) => previous.filter((message) => message.id !== item.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
