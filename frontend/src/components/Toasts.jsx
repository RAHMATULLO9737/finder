import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return <div key={t.id} className={`toast ${t.type}`}><Icon size={18} /> {t.message}</div>;
      })}
    </div>
  );
}
