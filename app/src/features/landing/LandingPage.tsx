import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../app/router/routeConfig';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 font-sans">

      {/* ─── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/brand/logo.svg" alt="GDO" className="h-8 w-8" />
            <span className="text-white font-bold text-lg tracking-tight">
              Građevinski Dnevnik Online
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.REPORTS}
              className="hidden sm:inline text-slate-400 hover:text-white text-sm transition-colors px-3 py-2"
            >
              Zatraži demo
            </Link>
            <Link
              to={ROUTES.REPORTS}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Isprobaj besplatno
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <section className="min-h-[calc(100vh-64px)] bg-slate-900 flex flex-col justify-center relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center py-24">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            ⚡ Za električare
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Digitalni dokaz radova
            </span>
            <br />
            <span className="text-white">za električare.</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-4">
            Sve slike, faze, izvještaji, glasovne bilješke i potpisi na jednom
            mjestu — spremno za klijenta i naplatu.
          </p>

          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed mb-10">
            Ne traži slike po WhatsAppu. Ne objašnjavaj ponovno što je
            napravljeno. Svaki projekt ima svoje slike, dnevne unose, potpis i
            PDF izvještaj koji možeš poslati klijentu u nekoliko klikova.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={ROUTES.REPORTS}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors inline-block"
            >
              Isprobaj besplatno →
            </Link>
            <Link
              to={ROUTES.REPORTS}
              className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-8 py-4 rounded-xl text-lg transition-colors inline-block"
            >
              Zatraži demo
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      </section>

      {/* ─── PROBLEM ─────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-blue-500 font-semibold text-sm tracking-widest uppercase mb-4">
            Problem
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10">
            Koliko puta ti se dogodilo da:
          </h2>

          <div className="space-y-3">
            {[
              'slike ostanu u galeriji ili WhatsAppu',
              'klijent kaže da nešto nije napravljeno',
              'ne znaš tko je što radio na projektu',
              'trebaš ponovno sastaviti izvještaj za klijenta',
              'nemaš dokaz što je napravljeno i kada',
            ].map((problem) => (
              <div
                key={problem}
                className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100"
              >
                <span className="text-red-400 text-lg leading-none mt-0.5 flex-shrink-0">✗</span>
                <span className="text-slate-700 font-medium">{problem}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-slate-900 text-white rounded-2xl p-8 text-center">
            <p className="text-xl font-semibold">
              Umjesto kaosa po mobitelu, sve imaš na jednom mjestu.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-blue-500 uppercase tracking-widest text-sm font-semibold mb-4">
            Kako radi
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Tri koraka do urednog projekta
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '1',
                title: 'Kreiraj projekt',
                body: 'Dodaj klijenta, lokaciju i osnovne podatke o projektu.',
              },
              {
                num: '2',
                title: 'Dodaj dnevni unos',
                body: 'Unesi što je napravljeno, dodaj slike, materijale i potpis. Možeš i snimiti kratku glasovnu poruku s terena, a sustav automatski pretvara govor u profesionalan izvještaj.',
              },
              {
                num: '3',
                title: 'Pošalji PDF klijentu',
                body: 'U nekoliko klikova generiraš profesionalan izvještaj koji možeš poslati klijentu ili spremiti za sebe.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative"
              >
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 pr-10">
                  {step.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-500 uppercase tracking-widest text-sm font-semibold mb-4">
            Što dobivaš
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">
            Sve što trebaju izvodači
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🖼️',
                title: 'Sve slike na jednom mjestu',
                body: 'Više ne tražiš slike po galeriji i WhatsAppu.',
              },
              {
                icon: '📋',
                title: 'Dnevni izvještaji',
                body: 'Svaki rad, faza i problem ostaju zapisani. Glasovne poruke automatski se pretvaraju u uredan tekst i izvještaj.',
              },
              {
                icon: '✅',
                title: 'Dokaz izvedenih radova',
                body: 'Ako klijent kaže da nešto nije napravljeno, imaš slike, datum, potpis i zapis što je napravljeno.',
              },
              {
                icon: '💳',
                title: 'Lakša naplata',
                body: 'Kad završiš posao, imaš gotov PDF koji možeš poslati klijentu.',
              },
              {
                icon: '👥',
                title: 'Tim i suradnja',
                body: 'Vidi tko je radio na projektu i što je napravljeno.',
              },
              {
                icon: '⚡',
                title: 'Napravljeno za električare',
                body: 'Specifično za električne instalacije i izvodače koji rade na terenu.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 text-xl">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-indigo-400 uppercase tracking-widest text-sm font-semibold mb-4">
            Društveni dokaz
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            Napravljen za električare koji žele manje kaosa i više kontrole.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              'Napokon imam sve slike i izvještaje na jednom mjestu.',
              'Više ne moram klijentu tražiti stare slike po WhatsAppu.',
              'Najviše mi znači što mogu odmah poslati PDF nakon obilaska.',
            ].map((quote) => (
              <div
                key={quote}
                className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-left"
              >
                <div className="text-indigo-400 text-4xl font-serif leading-none mb-3">"</div>
                <p className="text-slate-200 text-sm leading-relaxed italic mb-4">{quote}</p>
                <p className="text-slate-500 text-xs">— Električni izvodač</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PILOT OFFER ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-indigo-400 uppercase tracking-widest text-sm font-semibold mb-4">
            Osnivačka ponuda
          </p>
          <h2 className="text-4xl font-bold text-white mb-6">
            Tražimo prvih 10 električara.
          </h2>
          <p className="text-slate-300 text-lg mb-8">Prvih 10 firmi dobiva:</p>

          <div className="inline-flex flex-col gap-3 text-left mb-12">
            {[
              '60 dana besplatno',
              'Founder cijenu zauvijek',
              'Pomoć kod onboardinga',
              'Mogućnost utjecaja na razvoj proizvoda',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-slate-200">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm flex-shrink-0">
                  ✓
                </div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto mb-12">
            {/* Card 1 */}
            <div className="bg-slate-800/50 border border-indigo-500/30 rounded-2xl p-6 text-center">
              <p className="text-slate-300 text-sm mb-2">Izvođač</p>
              <p className="text-3xl font-bold text-white">19 €/mj</p>
              <p className="text-indigo-400 text-sm mt-1">zauvijek</p>
            </div>

            {/* Card 2 — Popular */}
            <div className="bg-slate-800/50 border border-indigo-500/30 rounded-2xl p-6 text-center relative">
              <span className="absolute top-3 right-3 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Popular
              </span>
              <p className="text-slate-300 text-sm mb-2">Izvođač Pro</p>
              <p className="text-3xl font-bold text-white">49 €/mj</p>
              <p className="text-indigo-400 text-sm mt-1">zauvijek</p>
            </div>
          </div>

          <Link
            to={ROUTES.REPORTS}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-10 py-4 rounded-xl text-lg inline-block transition-colors"
          >
            Postani jedan od prvih 10 →
          </Link>
        </div>
      </section>

      {/* ─── REFERRAL ────────────────────────────────────────────────── */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Preporuči kolegu</h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            Ako preporučiš drugu firmu koja krene koristiti aplikaciju, dobivaš
            mjesec dana besplatno. Novi korisnik dobiva 50% popusta prvi mjesec.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 grid grid-cols-2 gap-4 text-center border border-slate-100">
            <div>
              <p className="text-slate-500 text-sm mb-1">Ti dobivaš</p>
              <p className="text-lg font-bold text-slate-900">1 mjesec besplatno</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm mb-1">Novi korisnik dobiva</p>
              <p className="text-lg font-bold text-indigo-500">50% popusta</p>
              <p className="text-sm text-slate-500">prvi mjesec</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA + FOOTER ──────────────────────────────────────── */}
      <section className="bg-slate-900 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Spreman isprobati?</h2>
          <p className="text-slate-400 mb-8">
            Pridruži se prvim korisnicima i dobij founder cijenu zauvijek.
          </p>
          <Link
            to={ROUTES.REPORTS}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-10 py-4 rounded-xl text-lg inline-block transition-colors"
          >
            Isprobaj besplatno →
          </Link>
        </div>

        <div className="border-t border-slate-800 mt-16 pt-8">
          <p className="text-slate-600 text-sm">
            © 2025 Gradevinski Dnevnik. Sve slike, faze, izvještaji i potpisi.
          </p>
        </div>
      </section>

    </div>
  );
}
