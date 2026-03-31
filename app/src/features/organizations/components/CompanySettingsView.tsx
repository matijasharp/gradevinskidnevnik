import React, { useState } from 'react';
import { Building2, Camera, MapPin, Briefcase, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Select } from '../../../shared/ui';
import { cn } from '../../../lib/utils';
import { DISCIPLINE_LABELS, type Discipline } from '../../../lib/disciplineConfig';
import type { Company } from '../../../shared/types';

const countryCodes = [
  { label: 'HR (+385)', value: '+385' },
  { label: 'DE (+49)', value: '+49' },
  { label: 'AT (+43)', value: '+43' },
  { label: 'SI (+386)', value: '+386' },
  { label: 'IT (+39)', value: '+39' },
  { label: 'UK (+44)', value: '+44' },
  { label: 'US (+1)', value: '+1' },
];

export default function CompanySettingsView({ company, onUpdate }: { company: Company, onUpdate: (data: any) => void }) {
  const [name, setName] = useState(company.name);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const [brandColor, setBrandColor] = useState(company.brandColor || '#6366f1');
  const [street, setStreet] = useState(company.street || (company.address?.split(',')[0] || ''));
  const [city, setCity] = useState(company.city || (company.address?.split(',')[1]?.trim() || ''));
  const [email, setEmail] = useState(company.email || '');
  const [phonePrefix, setPhonePrefix] = useState(() => {
    const found = countryCodes.find(c => company.phone?.startsWith(c.value));
    return found ? found.value : '+385';
  });
  const [phone, setPhone] = useState(() => {
    const found = countryCodes.find(c => company.phone?.startsWith(c.value));
    return found ? company.phone.slice(found.value.length).trim() : (company.phone || '');
  });
  const [website, setWebsite] = useState(company.website || '');
  const [discipline, setDiscipline] = useState<Discipline>(company.discipline ?? 'electro');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoUrl(base64);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setUploading(false);
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Naziv tvrtke je obavezan.';
    if (!email.trim()) newErrors.email = 'Email je obavezan.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email nije ispravan.';
    if (!street.trim()) newErrors.street = 'Ulica je obavezna.';
    if (!city.trim()) newErrors.city = 'Grad je obavezan.';
    if (!phone.trim()) newErrors.phone = 'Telefon je obavezan.';
    else if (!/^\d+$/.test(phone.replace(/\s/g, ''))) newErrors.phone = 'Telefon smije sadržavati samo brojeve.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccessMessage(null);
      return;
    }

    setErrors({});
    onUpdate({
      name,
      logoUrl,
      brandColor,
      street,
      city,
      address: `${street}, ${city}`,
      email,
      phone: `${phonePrefix} ${phone.trim()}`,
      website,
      discipline,
    });
    setSuccessMessage('Postavke su uspješno spremljene!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Postavke tvrtke</h1>
        <p className="text-zinc-500">Upravljajte vizualnim identitetom i podacima svoje tvrtke.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-400 uppercase">Logo tvrtke</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-200 relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 size={32} className="text-zinc-300" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 cursor-pointer transition-all"
                    >
                      <Camera size={18} /> Promijeni logo
                    </label>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Preporučeno: Kvadratni format, PNG ili JPG</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Naziv tvrtke"
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                  placeholder="Unesite naziv tvrtke"
                  error={errors.name}
                />
                <Select
                  label="Struka"
                  value={discipline}
                  onChange={(e: any) => setDiscipline(e.target.value as Discipline)}
                  options={Object.entries(DISCIPLINE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Boja branda</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 shadow-sm shrink-0">
                      <input
                        type="color"
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/5 focus:border-accent transition-all font-mono text-sm"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setBrandColor('#6366f1')}
                    className="text-xs text-slate-500 hover:text-slate-700 underline mt-1"
                  >
                    Resetiraj na zadano
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 space-y-6">
            <h3 className="text-lg font-bold">Kontakt podaci</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Ulica i broj"
                value={street}
                onChange={(e: any) => setStreet(e.target.value)}
                placeholder="npr. Ilica 10"
                error={errors.street}
              />
              <Input
                label="Grad"
                value={city}
                onChange={(e: any) => setCity(e.target.value)}
                placeholder="npr. Zagreb"
                error={errors.city}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="info@tvrtka.hr"
                error={errors.email}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Telefon</label>
                <div className="flex gap-2">
                  <div className="w-32">
                    <Select
                      options={countryCodes}
                      value={phonePrefix}
                      onChange={(e: any) => setPhonePrefix(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      className={cn(
                        "w-full px-4 py-3 bg-zinc-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/5 focus:border-accent transition-all",
                        errors.phone ? "border-red-500" : "border-zinc-100"
                      )}
                      value={phone}
                      onChange={(e: any) => setPhone(e.target.value)}
                      placeholder="9x xxx xxxx"
                    />
                  </div>
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Web stranica"
                  value={website}
                  onChange={(e: any) => setWebsite(e.target.value)}
                  placeholder="www.tvrtka.hr"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 space-y-6 sticky top-8">
            <h3 className="text-lg font-bold">Pregled identiteta</h3>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-zinc-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100" style={{ backgroundColor: brandColor + '10' }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 size={24} style={{ color: brandColor }} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: brandColor }}>{name || 'Naziv tvrtke'}</p>
                    <p className="text-xs text-zinc-400">Primjer zaglavlja</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full" style={{ backgroundColor: brandColor }}></div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase">Kontakt info u PDF-u</p>
                <div className="text-sm text-zinc-600 space-y-1">
                  {(street || city) && <p className="flex items-center gap-2"><MapPin size={14} /> {street}{street && city ? ', ' : ''}{city}</p>}
                  {email && <p className="flex items-center gap-2"><FileText size={14} /> {email}</p>}
                  {phone && <p className="flex items-center gap-2"><Briefcase size={14} /> {phone}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-4">
              {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 size={18} />
                  {successMessage}
                </div>
              )}
              <Button
                className="w-full py-4 h-auto text-base font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleSave}
                disabled={!name || uploading}
                style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}4D` }}
              >
                Spremi promjene
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
