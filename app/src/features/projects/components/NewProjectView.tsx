import React, { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Button, Card, Input, Select } from '../../../shared/ui';
import { getPhases } from '../../../lib/disciplineConfig';

function NewProjectView({ onCancel, onSubmit, company }: any) {
  const brandColor = company?.brandColor || '#3b82f6';
  const [data, setData] = useState({
    projectName: '',
    clientName: '',
    street: '',
    city: '',
    objectType: 'Stambeni',
    phase: 'Priprema',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-zinc-100 rounded-full">
          <X size={24} />
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Novi projekt</h1>
      </header>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Naziv projekta"
            placeholder="npr. Renovacija stana"
            value={data.projectName}
            onChange={(e: any) => setData({...data, projectName: e.target.value})}
          />
          <Input
            label="Naziv klijenta"
            placeholder="npr. Ivan Horvat"
            value={data.clientName}
            onChange={(e: any) => setData({...data, clientName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Ulica i broj"
            placeholder="npr. Ilica 10"
            value={data.street}
            onChange={(e: any) => setData({...data, street: e.target.value})}
          />
          <Input
            label="Grad"
            placeholder="npr. Zagreb"
            value={data.city}
            onChange={(e: any) => setData({...data, city: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Tip objekta"
            value={data.objectType}
            onChange={(e: any) => setData({...data, objectType: e.target.value})}
            options={[
              { value: 'Stambeni', label: 'Stambeni' },
              { value: 'Komercijalni', label: 'Komercijalni' },
              { value: 'Industrijski', label: 'Industrijski' },
              { value: 'Održavanje', label: 'Održavanje' },
            ]}
          />
          <Select
            label="Faza radova"
            value={data.phase}
            onChange={(e: any) => setData({...data, phase: e.target.value})}
            options={getPhases(company?.discipline).map((p: string) => ({ value: p, label: p }))}
          />
          <Input
            label="Datum početka"
            type="date"
            value={data.startDate}
            onChange={(e: any) => setData({...data, startDate: e.target.value})}
          />
        </div>

        <Button
          onClick={() => onSubmit(data)}
          className="w-full py-4 text-lg font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={!data.projectName || !data.clientName || !data.street || !data.city}
          style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}4D` }}
        >
          Kreiraj projekt
        </Button>
      </Card>
    </div>
  );
}

export default NewProjectView;
