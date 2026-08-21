import { Database } from 'lucide-react';
export default function EmptyPanel({ title='Sin datos cargados', text='Esta vista está preparada para conectarse al backend real.' }) {
  return (
    <div className="empty-panel">
      <div className="empty-icon"><Database size={24} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
