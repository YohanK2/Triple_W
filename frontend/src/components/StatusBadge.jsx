import { statusLabel, badgeClass } from '../services/format';

export default function StatusBadge({ status }) {
  return <span className={badgeClass(status)}>{statusLabel(status)}</span>;
}
