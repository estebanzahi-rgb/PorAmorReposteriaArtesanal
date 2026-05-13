'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@lib/api';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

function getMinDateTime(leadTimeHours: number): string {
  const min = new Date(Date.now() + leadTimeHours * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${min.getFullYear()}-${pad(min.getMonth() + 1)}-${pad(min.getDate())}T${pad(min.getHours())}:${pad(min.getMinutes())}`;
}

export function ScheduledAtPicker({ value, onChange }: Props) {
  const [leadTimeHours, setLeadTimeHours] = useState(24);

  useEffect(() => {
    apiFetch<{ leadTimeHours: number }>('/store-settings')
      .then((s) => setLeadTimeHours(s.leadTimeHours))
      .catch(() => {});
  }, []);

  return (
    <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
      <h2 className="text-lg font-semibold">Fecha y hora de entrega/recogida (opcional)</h2>
      <p className="text-sm text-muted-foreground">
        Puedes seleccionar cuándo deseas recibir tu pedido. El mínimo es {leadTimeHours} horas desde ahora.
      </p>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={getMinDateTime(leadTimeHours)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Quitar fecha programada
        </button>
      )}
    </section>
  );
}
