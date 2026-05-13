'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@lib/api';

interface Props {
  initial: { leadTimeHours: number; updatedAt: string; updatedBy: string };
}

export function StoreSettingsManager({ initial }: Props) {
  const { data: session } = useSession();
  const [leadTime, setLeadTime] = useState(String(initial.leadTimeHours));
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [updatedBy, setUpdatedBy] = useState(initial.updatedBy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    const hours = Number(leadTime);
    if (!Number.isInteger(hours) || hours < 0 || hours > 720) {
      setError('Ingresa un valor entre 0 y 720 horas');
      return;
    }
    if (!session?.backendToken) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const result = await apiFetch<{ leadTimeHours: number; updatedAt: string; updatedBy: string }>(
        '/admin/store-settings',
        {
          method: 'PUT',
          token: session.backendToken,
          body: JSON.stringify({ leadTimeHours: hours }),
        },
      );
      setUpdatedAt(result.updatedAt);
      setUpdatedBy(result.updatedBy);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-md">
      <h2 className="text-lg font-semibold">Antelación mínima de pedidos</h2>
      <p className="text-sm text-muted-foreground">
        Define cuántas horas de antelación necesitas para preparar un pedido.
        Los clientes no podrán agendar para menos de este tiempo.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          max={720}
          value={leadTime}
          onChange={(e) => setLeadTime(e.target.value)}
          className="w-24 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span className="text-sm text-muted-foreground">horas</span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Guardado correctamente</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
      <p className="text-xs text-muted-foreground">
        Última actualización: {new Date(updatedAt).toLocaleString('es-CO')} por {updatedBy}
      </p>
    </div>
  );
}
