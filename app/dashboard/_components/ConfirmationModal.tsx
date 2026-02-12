'use client';

import { AlertCircle, AlertTriangle, Info as InfoIcon } from 'lucide-react';

interface ConfirmationModalProps {
  showConfirmation: {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'success' | 'info';
    onConfirm?: () => void;
    confirmText?: string;
  };
  setShowConfirmation: React.Dispatch<React.SetStateAction<ConfirmationModalProps['showConfirmation']>>;
}

export function ConfirmationModal({ showConfirmation, setShowConfirmation }: ConfirmationModalProps) {
  if (!showConfirmation.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-8 border-b border-border flex flex-col items-center text-center space-y-4 ${
          showConfirmation.type === 'danger' ? 'bg-destructive/10' : 
          showConfirmation.type === 'warning' ? 'bg-warning/10' : 
          'bg-accent/10'
        }`}>
          <div className={`p-4 rounded-2xl ${
            showConfirmation.type === 'danger' ? 'bg-destructive/20 text-destructive' : 
            showConfirmation.type === 'warning' ? 'bg-warning/20 text-warning' : 
            'bg-accent/20 text-accent'
          }`}>
            {showConfirmation.type === 'danger' ? <AlertCircle className="w-10 h-10" /> : 
             showConfirmation.type === 'warning' ? <AlertTriangle className="w-10 h-10" /> : 
             <InfoIcon className="w-10 h-10" />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight uppercase italic">{showConfirmation.title}</h2>
            <p className="text-sm font-bold text-muted-foreground mt-2">{showConfirmation.message}</p>
          </div>
        </div>
        <div className="p-8 bg-secondary/30 flex flex-col gap-3">
          {showConfirmation.onConfirm && (
            <button
              onClick={showConfirmation.onConfirm}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${
                showConfirmation.type === 'danger' ? 'bg-destructive text-white shadow-destructive/20 hover:bg-destructive/90' : 
                showConfirmation.type === 'warning' ? 'bg-warning text-white shadow-warning/20 hover:bg-warning/90' : 
                'bg-accent text-white shadow-accent/20 hover:bg-accent/90'
              }`}
            >
              {showConfirmation.confirmText || 'Confirmar'}
            </button>
          )}
          <button
            onClick={() => setShowConfirmation(prev => ({ ...prev, isOpen: false }))}
            className="w-full py-4 font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition-all"
          >
            {showConfirmation.onConfirm ? 'Cancelar' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}
