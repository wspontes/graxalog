export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    delivered: 'Entregue',
    absent: 'Ausente',
    third_party: 'Entregue a Terceiro',
    in_route: 'Pendente',
  };
  return map[status] || status;
}

export function formatDateTime(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('pt-BR');
}

export function formatTime(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
