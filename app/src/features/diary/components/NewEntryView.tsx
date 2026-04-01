import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Camera, Mic, Folder, CloudSun, Bell, Zap, Loader2, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';
import SignatureCanvas from 'react-signature-canvas';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { GoogleGenAI, Type } from '@google/genai';
import { fetchDiaryPhotos, createDiaryEntry, updateDiaryEntry, createDiaryPhoto, uploadDiaryPhoto, updateDiaryPhoto, deleteDiaryPhoto } from '../../../lib/data';
import type { DiaryEntry, DiaryPhoto, Project } from '../../../shared/types';
import { compressImage, trimCanvas } from '../../../shared/utils/image';
import { OperationType, handleFirestoreError } from '../../../shared/utils/error';
import { cn } from '../../../lib/utils';
import { Button, Card, Input, Select } from '../../../shared/ui';
import { getPhases, getWorkTypes } from '../../../lib/disciplineConfig';

const SUGGESTED_MATERIALS = [
  'Kabel PGP 3x1.5 mm2',
  'Kabel PGP 3x2.5 mm2',
  'Kabel PGP 5x2.5 mm2',
  'Bužir cijev FI 16',
  'Bužir cijev FI 20',
  'Razvodna kutija FI 60',
  'Razvodna kutija FI 78',
  'Automatski osigurač 10A',
  'Automatski osigurač 16A',
  'FID sklopka 40/0.03A',
  'Utičnica (bijela)',
  'Prekidač (obični)',
  'Prekidač (izmjenični)',
];

export default function NewEntryView({ appUser, projects, initialProject, initialEntry, materialHistory, materialUnits, company, onCancel, onSuccess }: any) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [photos, setPhotos] = useState<{ url: string; description: string; file?: File }[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<DiaryPhoto[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<{ id: string; url: string }[]>([]);
  const [lineItems, setLineItems] = useState<{ name: string; quantity: number; unit: string }[]>(initialEntry?.lineItems || []);
  const [data, setData] = useState({
    projectId: initialEntry?.projectId || initialProject?.id || '',
    entryDate: initialEntry?.entryDate || format(new Date(), 'yyyy-MM-dd'),
    title: initialEntry?.title || '',
    phase: initialEntry?.phase || initialProject?.phase || 'Priprema',
    workType: initialEntry?.workType || 'razvod',
    zone: initialEntry?.zone || '',
    description: initialEntry?.description || '',
    status: initialEntry?.status || 'djelomično završeno',
    hours: initialEntry?.hours || 8,
    workersCount: initialEntry?.workersCount || 1,
    materialsUsed: initialEntry?.materialsUsed || '',
    missingItems: initialEntry?.missingItems || '',
    returnVisitNeeded: initialEntry?.returnVisitNeeded || false,
    issueNote: initialEntry?.issueNote || '',
    weatherCondition: initialEntry?.weatherCondition || '',
    temperature: initialEntry?.temperature || 0,
    reminderAt: initialEntry?.reminderAt || '',
    reminderNotified: initialEntry?.reminderNotified || false,
    signatureUrl: initialEntry?.signatureUrl || ''
  });

  useEffect(() => {
    const newTitle = data.zone ? `${data.phase} - ${data.zone}` : data.phase;
    if (data.title !== newTitle) {
      setData(prev => ({ ...prev, title: newTitle }));
    }
  }, [data.phase, data.zone]);

  useEffect(() => {
    if (initialEntry) {
      const fetchPhotos = async () => {
        try {
          const photos = await fetchDiaryPhotos(initialEntry.id);
          setExistingPhotos(photos);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'diaryPhotos-edit');
        }
      };
      fetchPhotos();
    }
  }, [initialEntry]);

  useEffect(() => {
    if (initialEntry?.signatureUrl && signaturePadRef.current && step === 4) {
      signaturePadRef.current.fromDataURL(initialEntry.signatureUrl);
    }
  }, [initialEntry, step]);

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setPhotos(prev => [...prev, { url: compressed, description: '', file }]);
        } catch (e) {
          console.error('Image compression failed:', e);
          setPhotos(prev => [...prev, { url: reader.result as string, description: '', file }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 10
  });

  const handleVoiceNote = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Vaš preglednik ne podržava prepoznavanje govora.");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'hr-HR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setData(prev => ({
        ...prev,
        description: prev.description ? prev.description + " " + transcript : transcript
      }));
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        console.error("Speech recognition error:", event.error);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsRecording(false);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onDrop(Array.from(files));
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setWeatherError(null);
      const proj = projects.find((p: Project) => p.id === data.projectId);
      if (!proj || !proj.city) {
        setWeatherError("Prvo odaberite projekt s unesenim gradom.");
        return;
      }

      setLoadingWeather(true);
      // Use project city to fetch weather
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(proj.city)}&count=1&language=en&format=json`);
      const geoData = await response.json();

      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();

        if (weatherData.current_weather) {
          const temp = Math.round(weatherData.current_weather.temperature);
          const code = weatherData.current_weather.weathercode;

          // Map WMO codes to simple Croatian descriptions
          const weatherMap: Record<number, string> = {
            0: 'Vedro',
            1: 'Pretežno vedro', 2: 'Djelomično oblačno', 3: 'Oblačno',
            45: 'Magla', 48: 'Magla',
            51: 'Sipi kiša', 53: 'Sipi kiša', 55: 'Sipi kiša',
            56: 'Sipi kiša', 57: 'Sipi kiša',
            61: 'Kiša', 63: 'Kiša', 65: 'Jaka kiša',
            66: 'Ledenica', 67: 'Ledenica',
            71: 'Snijeg', 73: 'Snijeg', 75: 'Jak snijeg',
            77: 'Snijeg',
            80: 'Pljuskovi', 81: 'Pljuskovi', 82: 'Jaki pljuskovi',
            85: 'Pljuskovi snijega', 86: 'Jaki pljuskovi snijega',
            95: 'Grmljavina', 96: 'Grmljavina s tučom', 99: 'Grmljavina s tučom'
          };

          setData(prev => ({
            ...prev,
            temperature: temp,
            weatherCondition: weatherMap[code] || 'Promjenjivo'
          }));
        } else {
          setWeatherError("Nije moguće dohvatiti podatke o vremenu.");
        }
      } else {
        setWeatherError(`Grad "${proj.city}" nije pronađen.`);
      }
    } catch (e) {
      console.error("Weather fetch error:", e);
      setWeatherError("Greška pri dohvaćanju vremena.");
    } finally {
      setLoadingWeather(false);
    }
  };

  const processWithAI = async (description: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiziraj ovaj dnevni izvještaj električara i strukturiraj ga profesionalno na hrvatskom jeziku.
        Ulaz: "${description}"
        Vrati isključivo strukturirani izvještaj koristeći Markdown (h1, h2, h3, liste, podebljani tekst).
        NEMOJ uključivati nikakav uvodni tekst poput "Evo izvještaja" ili "Kao voditelj projekta".
        Započni odmah s naslovom ili prvom točkom izvještaja.`,
        config: {
          systemInstruction: "Ti si profesionalni voditelj elektroinstalacijskih projekata. Sažmi obavljene radove jasno i precizno na hrvatskom jeziku koristeći Markdown. Budi direktan i profesionalan, bez uvodnih fraza.",
        }
      });
      return response.text;
    } catch (e) {
      console.error("AI Error:", e);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!data.projectId || !data.description) return;
    setLoading(true);
    try {
      let aiSummary = initialEntry?.aiSummary || null;
      if (data.description !== initialEntry?.description) {
        aiSummary = await processWithAI(data.description);
      }

      let entryId = initialEntry?.id;

      // Get signature if exists
      let signatureUrl = data.signatureUrl;
      if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        const canvas = signaturePadRef.current.getCanvas();
        const trimmedCanvas = trimCanvas(canvas);
        signatureUrl = trimmedCanvas.toDataURL('image/png');
      }

      if (initialEntry) {
        await updateDiaryEntry(initialEntry.id, {
          ...data,
          signatureUrl,
          lineItems,
          aiSummary
        });

        for (const removed of removedPhotos) {
          await deleteDiaryPhoto(removed.id, removed.url);
        }

        // Update existing photos descriptions
        for (const photo of existingPhotos) {
          try {
            await updateDiaryPhoto(photo.id, photo.description || '');
          } catch (error) {
            console.error('Update photo error:', error);
          }
        }
      } else {
        entryId = await createDiaryEntry(appUser.companyId, {
          ...data,
          signatureUrl,
          lineItems,
          companyId: appUser.companyId,
          createdBy: appUser.id,
          createdByName: appUser.name,
          aiSummary
        } as DiaryEntry);
      }

      for (const photo of photos) {
        try {
          let photoUrl = photo.url;
          if (photo.file && entryId) {
            try {
              photoUrl = await uploadDiaryPhoto(photo.file, appUser.companyId, entryId);
            } catch (e) {
              console.error('Storage upload failed, falling back to base64', e);
            }
          }
          await createDiaryPhoto({
            entryId: entryId,
            projectId: data.projectId,
            companyId: appUser.companyId,
            url: photoUrl,
            description: photo.description
          });
        } catch (error) {
          console.error('Create photo error:', error);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Save entry error:', error);
      alert('Greška pri spremanju unosa. Pokušajte ponovno.');
    }
    setLoading(false);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { name: '', quantity: 1, unit: 'kom' }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    (newItems[index] as any)[field] = value;

    // Auto-fill unit if name matches a known material
    if (field === 'name' && materialUnits && materialUnits[value]) {
      newItems[index].unit = materialUnits[value];
    }

    setLineItems(newItems);
  };

  const combinedSuggestions = Array.from(new Set([...SUGGESTED_MATERIALS, ...(materialHistory || [])]));

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{initialEntry ? 'Uredi unos' : 'Novi unos'}</h1>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={cn(
                "w-8 h-1.5 rounded-full transition-all",
                step >= s ? "bg-accent" : "bg-zinc-200"
              )}
            />
          ))}
        </div>
      </header>

      <div className="space-y-6">
        {step === 1 && (
          <Card className="p-6 space-y-6">
            <Select
              label="Odaberi projekt"
              value={data.projectId}
              onChange={(e: any) => setData({...data, projectId: e.target.value})}
              options={[
                { value: '', label: 'Odaberi projekt...' },
                ...projects.map((p: Project) => ({ value: p.id, label: p.projectName }))
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Datum"
                type="date"
                value={data.entryDate}
                onChange={(e: any) => setData({...data, entryDate: e.target.value})}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Naslov zapisa (automatski)</label>
                <div className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-600 font-medium text-sm">
                  {data.title || 'Odaberite fazu i zonu...'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Faza radova"
                value={data.phase}
                onChange={(e: any) => setData({...data, phase: e.target.value})}
                options={getPhases(company?.discipline).map((p: string) => ({ value: p, label: p }))}
              />
              <Select
                label="Vrsta posla"
                value={data.workType}
                onChange={(e: any) => setData({...data, workType: e.target.value})}
                options={getWorkTypes(company?.discipline)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Zona/Prostorija"
                placeholder="npr. Kuhinja, Kat 1..."
                value={data.zone}
                onChange={(e: any) => setData({...data, zone: e.target.value})}
              />
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CloudSun size={12} /> Vrijeme i temperatura
                </p>
                <button
                  onClick={fetchWeather}
                  disabled={loadingWeather}
                  className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {loadingWeather ? (
                    <Loader2 className="animate-spin" size={10} />
                  ) : (
                    <Zap size={10} />
                  )}
                  {loadingWeather ? 'Dohvaćam...' : 'Dohvati trenutno'}
                </button>
              </div>
              {weatherError && (
                <p className="text-[10px] text-red-500 font-medium">{weatherError}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="npr. Sunčano"
                  value={data.weatherCondition}
                  onChange={(e: any) => setData({...data, weatherCondition: e.target.value})}
                />
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="20"
                    value={data.temperature}
                    onChange={(e: any) => setData({...data, temperature: parseFloat(e.target.value) || 0})}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">°C</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full py-4" disabled={!data.projectId || !data.title}>
              Dalje: Slike i bilješke
            </Button>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Foto dokazi</label>

              <div className="grid grid-cols-2 gap-3">
                <div {...getRootProps()} className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 md:p-6 text-center hover:bg-zinc-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                  <input {...getInputProps()} />
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                    <Folder size={18} />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Galerija</p>
                </div>

                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-accent/20 bg-accent/5 rounded-2xl p-4 md:p-6 text-center hover:bg-accent/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-accent"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Camera size={18} />
                  </div>
                  <p className="text-[10px] font-bold uppercase">Slikaj</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={cameraInputRef}
                    onChange={handleCameraCapture}
                  />
                </button>
              </div>

              {(photos.length > 0 || existingPhotos.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {existingPhotos.map((p) => (
                    <div key={p.id} className="flex gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img src={p.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Opis slike</label>
                        <input
                          type="text"
                          className="w-full text-xs p-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                          placeholder="npr. Razvodna kutija u hodniku"
                          value={p.description || ''}
                          onChange={(e) => {
                            const newPhotos = [...existingPhotos];
                            const idx = newPhotos.findIndex(photo => photo.id === p.id);
                            newPhotos[idx].description = e.target.value;
                            setExistingPhotos(newPhotos);
                          }}
                        />
                      </div>
                      <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setRemovedPhotos(prev => [...prev, { id: p.id, url: p.url }]);
                           setExistingPhotos(prev => prev.filter(photo => photo.id !== p.id));
                         }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {photos.map((p, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-accent/5 rounded-2xl border border-accent/10 relative group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-accent/20 relative">
                        <img src={p.url} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[8px] font-bold text-center py-0.5">NOVO</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-accent/60 uppercase">Opis slike</label>
                        <input
                          type="text"
                          className="w-full text-xs p-2 bg-white border border-accent/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                          placeholder="npr. Postavljeni bužiri u kuhinji"
                          value={p.description}
                          onChange={(e) => {
                            const newPhotos = [...photos];
                            newPhotos[i].description = e.target.value;
                            setPhotos(newPhotos);
                          }}
                        />
                      </div>
                      <button
                         onClick={(e) => { e.stopPropagation(); setPhotos(photos.filter((_, idx) => idx !== i)); }}
                        className="absolute -top-2 -right-2 bg-black/50 text-white p-1.5 rounded-full shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Opis radova</label>
                <button
                  onClick={handleVoiceNote}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all",
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  <Mic size={14} /> {isRecording ? "Slušam..." : "Glasovna bilješka"}
                </button>
              </div>
              <textarea
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-300 transition-all min-h-[120px]"
                placeholder="Što je danas odrađeno?"
                value={data.description}
                onChange={(e) => setData({...data, description: e.target.value})}
              />
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Natrag</Button>
              <Button onClick={() => setStep(3)} className="flex-[2]" disabled={!data.description}>Dalje: Stavke materijala</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Utrošeni materijal / Stavke</label>
                <Button variant="secondary" className="py-1 px-3 text-xs" onClick={addLineItem}>
                  <Plus size={14} /> Dodaj stavku
                </Button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 relative group space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Naziv stavke"
                          value={item.name}
                          onChange={(e: any) => updateLineItem(idx, 'name', e.target.value)}
                          list="material-suggestions"
                        />
                      </div>
                      <button
                        onClick={() => removeLineItem(idx)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Količina"
                        type="number"
                        value={item.quantity}
                        onChange={(e: any) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                      />
                      <Select
                        label="Jedinica"
                        value={item.unit}
                        onChange={(e: any) => updateLineItem(idx, 'unit', e.target.value)}
                        options={[
                          { value: 'kom', label: 'kom' },
                          { value: 'm', label: 'm' },
                          { value: 'cm', label: 'cm' },
                          { value: 'kg', label: 'kg' },
                          { value: 'set', label: 'set' },
                        ]}
                      />
                    </div>
                  </div>
                ))}

                {lineItems.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Često korišteno (klikni za brzi unos):</p>
                    <div className="flex flex-wrap gap-2">
                      {combinedSuggestions.slice(0, 8).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const lastIdx = lineItems.length - 1;
                            const unit = materialUnits?.[s] || 'kom';
                            if (lastIdx >= 0 && !lineItems[lastIdx].name) {
                              updateLineItem(lastIdx, 'name', s);
                              updateLineItem(lastIdx, 'unit', unit);
                            } else {
                              setLineItems([...lineItems, { name: s, quantity: 1, unit }]);
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:border-accent hover:text-accent transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {lineItems.length === 0 && (
                  <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <p className="text-sm text-zinc-400 mb-4 italic">Nema dodanih stavki.</p>
                    <div className="flex flex-wrap justify-center gap-2 px-4">
                      {combinedSuggestions.slice(0, 6).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const unit = materialUnits?.[s] || 'kom';
                            setLineItems([{ name: s, quantity: 1, unit }]);
                          }}
                          className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:border-accent hover:text-accent transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <datalist id="material-suggestions">
                  {combinedSuggestions.map((s, i) => (
                    <option key={i} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Dodatne napomene o materijalu</label>
                <textarea
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-300 transition-all min-h-[80px] text-sm"
                  placeholder="npr. Potrošeno više kabla zbog promjene trase..."
                  value={data.materialsUsed}
                  onChange={(e) => setData({...data, materialsUsed: e.target.value})}
                />
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Natrag</Button>
              <Button onClick={() => setStep(4)} className="flex-[2]">Zadnji detalji</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <Card className="p-6 space-y-6">
            <Select
              label="Trenutni status"
              value={data.status}
              onChange={(e: any) => setData({...data, status: e.target.value})}
              options={[
                { value: 'završeno', label: 'Završeno' },
                { value: 'djelomično završeno', label: 'Djelomično završeno' },
                { value: 'čeka materijal', label: 'Čeka materijal' },
                { value: 'blokirano', label: 'Blokirano' },
                { value: 'potrebno dodatno', label: 'Potrebno dodatno' },
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Radni sati"
                type="number"
                value={data.hours}
                onChange={(e: any) => setData({...data, hours: Number(e.target.value)})}
              />
              <Input
                label="Radnika na terenu"
                type="number"
                value={data.workersCount}
                onChange={(e: any) => setData({...data, workersCount: Number(e.target.value)})}
              />
            </div>
            <Input
              label="Nedostaje / Prepreke"
              placeholder="Što vas koči u radu?"
              value={data.missingItems}
              onChange={(e: any) => setData({...data, missingItems: e.target.value})}
            />

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
              <span className="text-sm font-medium">Potreban ponovni dolazak?</span>
              <button
                onClick={() => setData({...data, returnVisitNeeded: !data.returnVisitNeeded})}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  data.returnVisitNeeded ? "bg-accent" : "bg-zinc-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  data.returnVisitNeeded ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell size={12} /> Postavi podsjetnik
                </p>
              </div>
              <Input
                type="datetime-local"
                value={data.reminderAt}
                onChange={(e: any) => setData({...data, reminderAt: e.target.value, reminderNotified: false})}
              />
              <p className="text-[10px] text-zinc-400 italic">Aplikacija će vas obavijestiti u odabrano vrijeme.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Potpis (opcionalno)</label>
                {(data.signatureUrl || (signaturePadRef.current && !signaturePadRef.current.isEmpty())) && (
                  <button
                    onClick={() => {
                      signaturePadRef.current?.clear();
                      setData({...data, signatureUrl: ''});
                    }}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    Očisti potpis
                  </button>
                )}
              </div>
              <div className="border-2 border-zinc-100 rounded-2xl bg-white overflow-hidden">
                <SignatureCanvas
                  ref={signaturePadRef}
                  penColor='black'
                  canvasProps={{
                    className: "w-full h-40 cursor-crosshair",
                    style: { width: '100%', height: '160px' }
                  }}
                />
              </div>
              {data.signatureUrl && !signaturePadRef.current?.isEmpty() && (
                <p className="text-[10px] text-zinc-400 italic">Prethodni potpis je učitan. Ponovnim potpisivanjem ćete ga zamijeniti.</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Natrag</Button>
              <Button onClick={handleSubmit} className="flex-[2] py-4" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Spremi unos"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
