import { Package } from 'lucide-react';

export default function EmptyState({ icon = <Package size={22} />, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      {title ? <div className="empty-state-title">{title}</div> : null}
      {description ? <div className="empty-state-desc">{description}</div> : null}
    </div>
  );
}
