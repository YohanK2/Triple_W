import { statusLabel, badgeClass } from '../utils/format';

export default function StatusBadge({ status }) {
  return <span className={badgeClass(status)}>{statusLabel(status)}</span>;
}
