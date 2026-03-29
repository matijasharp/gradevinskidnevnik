import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Card } from '../ui';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Došlo je do neočekivane pogreške.";
      let isQuotaError = false;

      try {
        const parsedError = JSON.parse(this.state.error.message);
        if (parsedError.userMessage) {
          displayMessage = parsedError.userMessage;
          isQuotaError = true;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-none">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Ups! Nešto je pošlo po krivu</h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {displayMessage}
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full py-4 h-auto text-base font-bold"
              >
                Osvježi stranicu
              </Button>
              {!isQuotaError && (
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                  Ako se problem nastavi, kontaktirajte podršku.
                </p>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
