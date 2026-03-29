import { cn } from '../../lib/utils';

const Select = ({ label, options, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <select
      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/5 focus:border-accent transition-all appearance-none"
      {...props}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default Select;
