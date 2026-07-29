export function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const entry = { timestamp: new Date().toISOString(), level, message, data };
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
