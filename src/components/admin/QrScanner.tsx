'use client';
import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;
    let scanner: any = null;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        scanner = new Html5Qrcode('qr-reader');

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            scanner.stop().catch(() => {});
            if (!cancelled) onScanRef.current(decodedText);
          },
          () => {}
        );

        if (!cancelled) setStatus('scanning');
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err?.message || 'Erro ao acessar a câmera');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-lg font-semibold">Escaneie o QR Code</span>
        <button onClick={onClose} className="px-4 py-2 bg-white/20 rounded-lg text-sm">Fechar</button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {status === 'starting' && (
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4" />
            <p className="text-sm">Iniciando câmera...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-white text-center max-w-sm">
            <p className="text-lg mb-2">✕</p>
            <p className="text-sm mb-4">{errorMsg}</p>
            <p className="text-xs text-white/60 mb-6">
              Verifique se permitiu o acesso à câmera nas configurações do navegador
            </p>
            <button onClick={onClose} className="px-6 py-2 bg-white/20 rounded-lg text-sm">Fechar</button>
          </div>
        )}

        <div id="qr-reader" className={`w-full max-w-sm rounded-xl overflow-hidden shadow-2xl ${status !== 'scanning' ? 'hidden' : ''}`} />
      </div>

      <p className="text-center text-white/60 text-sm pb-6">
        {status === 'scanning' ? 'Aponte a câmera para o código QR do pacote' : ' '}
      </p>
    </div>
  );
}
