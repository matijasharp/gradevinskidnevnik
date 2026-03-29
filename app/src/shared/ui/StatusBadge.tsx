import { cn } from '../../lib/utils';

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'završeno': 'bg-green-100 text-green-600',
    'djelomično završeno': 'bg-sky-100 text-sky-600',
    'čeka materijal': 'bg-orange-100 text-orange-600',
    'blokirano': 'bg-red-100 text-red-600',
    'potrebno dodatno': 'bg-purple-100 text-purple-600',
  };
  return (
    <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", styles[status])}>
      {status}
    </span>
  );
}

export default StatusBadge;
