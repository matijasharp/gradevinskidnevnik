import { cn } from '../../lib/utils';

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'završeno':              'bg-success/10 text-success',
    'djelomično završeno':   'bg-accent-subtle text-accent',
    'čeka materijal':        'bg-warning-subtle text-text-secondary',
    'blokirano':             'bg-error/10 text-error',
    'potrebno dodatno':      'bg-secondary/10 text-secondary',
  };
  return (
    <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", styles[status])}>
      {status}
    </span>
  );
}

export default StatusBadge;
