import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { ScriptureComposer } from '../components/ScriptureComposer';
import { SelectServiceModal } from '../components/SelectServiceModal';
import type { ServiceItem } from '../lib/types';

export default function Scripture() {
  const [item, setItem] = useState<ServiceItem | null>(null);
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LET THE WORD SPEAK</span>
          <h1>
            A little space for <em>scripture.</em>
          </h1>
          <p>Find the passage. Find the flow. Let every word have its moment.</p>
        </div>
        <span className="scripture-library-badge">
          <BookOpen size={18} />
          <span>
            <strong>Two complete translations</strong>
            <small>KJV & ASV · 66 books each</small>
          </span>
        </span>
      </div>
      <ScriptureComposer onAdd={setItem} />
      <p className="scripture-legal">
        KJV and ASV (1901) are historic public-domain texts in many jurisdictions. KJV rights differ in the
        UK. Verify the text against your preferred edition before presenting. Translation libraries load on
        demand.
      </p>
      {item && <SelectServiceModal item={item} onClose={() => setItem(null)} />}
    </div>
  );
}
