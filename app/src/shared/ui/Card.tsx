import { cn } from '../../lib/utils';

const Card = ({ children, className, onClick, style }: any) => (
  <div
    onClick={onClick}
    className={cn('bg-white border border-slate-100 rounded p-4 shadow-sm hover:shadow-md hover:border-accent/20 transition-all', className)}
    style={style}
  >
    {children}
  </div>
);

export default Card;
