import { cn } from '../../lib/utils';

const Button = ({ className, variant = 'primary', ...props }: any) => {
  const variants: any = {
    primary: 'bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20',
    secondary: 'bg-zinc-100 text-black hover:bg-zinc-200',
    outline: 'border border-zinc-200 text-black hover:bg-zinc-50',
    ghost: 'text-zinc-600 hover:bg-zinc-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  };
  return (
    <button
      className={cn(
        'px-4 py-2 rounded font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export default Button;
