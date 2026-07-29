'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { addToQueue } from '@/lib/offline-queue';
import MobileLayout from '@/components/delivery/MobileLayout';
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(() => import('@/components/delivery/DeliveryMap'), { ssr: false });

export default function RouteDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendPhoto, setSendPhoto] = useState<{ packageId: number; action: 'third_party' } | null>(null);
  const [notes, setNotes] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
    loadRoute();
  }, []);

  async function loadRoute() {
    try {
      const data = await api.delivery.routeDetail(parseInt(id));
      setRoute(data);
    } catch {
      const data = await api.delivery.routes();
      const found = data.find((r: any) => r.id === parseInt(id));
      if (found) setRoute(found);
    }
    setLoading(false);
  }

  async function handleUpdate(packageId: number, status: string) {
    if (status === 'third_party') {
      setSendPhoto({ packageId, action: 'third_party' });
      setPhotoData(null);
      setNotes('');
      setShowCamera(true);
      return;
    }

    const formData = new FormData();
    formData.append('status', status);
    if (notes) formData.append('notes', notes);

    try {
      await api.delivery.updateStatus(parseInt(id), packageId, formData);
      setNotes('');
      loadRoute();
    } catch {
      addToQueue({ routeId: parseInt(id), packageId, status, notes });
      loadRoute();
    }
  }

  async function handleThirdPartySubmit() {
    if (!sendPhoto) return;
    const formData = new FormData();
    formData.append('status', 'third_party');
    formData.append('notes', notes);

    if (photoData) {
      const blob = dataURLtoBlob(photoData);
      formData.append('photo', blob, `photo-${sendPhoto.packageId}.jpg`);
    }

    try {
      await api.delivery.updateStatus(parseInt(id), sendPhoto.packageId, formData);
    } catch {
      addToQueue({
        routeId: parseInt(id),
        packageId: sendPhoto.packageId,
        status: 'third_party',
        notes,
        photoData: photoData || undefined,
      });
    }
    setSendPhoto(null);
    setPhotoData(null);
    setNotes('');
    setShowCamera(false);
    loadRoute();
  }

  function openCamera() {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }).catch(() => alert('Não foi possível acessar a câmera'));
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      setPhotoData(canvas.toDataURL('image/jpeg', 0.8));
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach((t) => t.stop());
      setShowCamera(false);
    }
  }

  if (loading) return <MobileLayout><p className="text-center text-gray-400 mt-8">Carregando...</p></MobileLayout>;
  if (!route) return <MobileLayout><p className="text-center text-gray-400 mt-8">Rota não encontrada</p></MobileLayout>;

  const packages = route.packages || [];
  const pending = packages.filter((p: any) => p.status === 'in_route');

  return (
    <MobileLayout>
      <div className="mb-4">
        <button onClick={() => router.push('/app/routes')} className="text-sm text-primary-600 mb-2">&larr; Voltar</button>
        <h2 className="text-lg font-bold">{route.name}</h2>
        <div className="flex gap-3 text-sm text-gray-500 mt-1">
          <span>Total: {route.total_packages}</span>
          <span className="text-emerald-600">✓ {route.delivered_count}</span>
          <span className="text-orange-600">✗ {route.absent_count}</span>
          <span className="text-purple-600">◉ {route.third_party_count}</span>
        </div>
        {route.started_at && (
          <p className="text-xs text-gray-400 mt-1">Início: {new Date(route.started_at).toLocaleTimeString()}</p>
        )}
      </div>

      <div className="mb-4">
        <DeliveryMap packages={packages} />
      </div>

      <div className="space-y-3">
        {packages.map((pkg: any, index: number) => (
          <div key={pkg.id || pkg.package_id} className={`bg-white rounded-xl border p-4 ${pkg.status !== 'in_route' ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-gray-400">#{pkg.stop_order || index + 1}</span>
                <h3 className="font-semibold text-sm mt-0.5">{pkg.recipient}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{pkg.address}</p>
                <p className="text-xs text-gray-400">{pkg.neighborhood}{pkg.city ? `, ${pkg.city}` : ''}</p>
                {pkg.notes && <p className="text-xs mt-1 text-gray-500 italic">{pkg.notes}</p>}
                {pkg.photo_url && (
                  <img src={pkg.photo_url} alt="Comprovante" className="mt-2 rounded-lg max-h-32 object-cover" />
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                pkg.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                pkg.status === 'absent' ? 'bg-orange-100 text-orange-700' :
                pkg.status === 'third_party' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {pkg.status === 'delivered' ? 'Entregue' : pkg.status === 'absent' ? 'Ausente' : pkg.status === 'third_party' ? 'Terceiro' : 'Pendente'}
              </span>
            </div>

            {pkg.status === 'in_route' && (
              <>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleUpdate(pkg.package_id || pkg.id, 'delivered')} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium">
                    Entregue
                  </button>
                  <button onClick={() => handleUpdate(pkg.package_id || pkg.id, 'absent')} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium">
                    Ausente
                  </button>
                  <button onClick={() => handleUpdate(pkg.package_id || pkg.id, 'third_party')} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium">
                    Terceiro
                  </button>
                </div>
                <div className="mt-2">
                  <input
                    placeholder="Observação (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {pending.length === 0 && packages.length > 0 && (
        <div className="mt-6">
          <button onClick={async () => {
            await api.delivery.finishRoute(parseInt(id));
            router.push('/app/routes');
          }} className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium">
            Encerrar Rota
          </button>
        </div>
      )}

      {sendPhoto && showCamera && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
          {!photoData ? (
            <>
              <video ref={videoRef} className="w-full max-w-md" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2 mt-4">
                <button onClick={openCamera} className="px-6 py-2 bg-white text-black rounded-lg">Abrir Câmera</button>
                <button onClick={capturePhoto} className="px-6 py-2 bg-primary-600 text-white rounded-lg">Capturar</button>
                <button onClick={() => { setShowCamera(false); setSendPhoto(null); }} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Cancelar</button>
              </div>
            </>
          ) : (
            <div className="bg-white p-4 rounded-2xl w-full max-w-sm">
              <img src={photoData} alt="Foto" className="w-full rounded-lg mb-4" />
              <input placeholder="Observação (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" />
              <div className="flex gap-2">
                <button onClick={handleThirdPartySubmit} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm">Confirmar</button>
                <button onClick={() => setPhotoData(null)} className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm">Tirar outra</button>
              </div>
            </div>
          )}
        </div>
      )}
    </MobileLayout>
  );
}

function dataURLtoBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)![1];
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
