import { create } from 'zustand';

import { formatClock } from '@/lib/format';

export type LogLevel = 'DEBUG' | 'INFO' | 'DATA' | 'COMMAND' | 'SUCCESS' | 'WARN' | 'ERROR';

export type LogDetails = Record<string, string | number | boolean | null | undefined>;

export interface LogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  /** Which part of the app produced the entry, e.g. "device", "app". */
  source: string;
  message: string;
  details?: LogDetails;
}

/** Oldest entries are dropped beyond this, so a long drive cannot grow memory without bound. */
const MAX_ENTRIES = 600;

interface LogState {
  entries: LogEntry[];
  append: (entry: LogEntry) => void;
  clear: () => void;
}

/**
 * In-memory log buffer. To persist logs later, write `append`/`clear` through to storage here —
 * nothing else in the app touches the buffer directly.
 */
export const useLogStore = create<LogState>((set) => ({
  entries: [],
  append: (entry) =>
    set((state) => ({
      entries:
        state.entries.length >= MAX_ENTRIES
          ? [...state.entries.slice(state.entries.length - MAX_ENTRIES + 1), entry]
          : [...state.entries, entry],
    })),
  clear: () => set({ entries: [] }),
}));

let nextId = 1;

export function formatDetails(details: LogDetails | undefined): string {
  if (!details) return '';
  return Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ');
}

export function formatEntry(entry: LogEntry): string {
  const details = formatDetails(entry.details);
  const head = `[${formatClock(entry.timestamp)}] ${entry.level.padEnd(7)} ${entry.source}: ${entry.message}`;
  return details ? `${head} | ${details}` : head;
}

function mirrorToConsole(entry: LogEntry) {
  if (!__DEV__) return;
  const line = formatEntry(entry);
  if (entry.level === 'ERROR' || entry.level === 'WARN') console.warn(line);
  else if (entry.level === 'DEBUG' || entry.level === 'DATA') console.debug(line);
  else console.log(line);
}

function write(level: LogLevel, source: string, message: string, details?: LogDetails) {
  const entry: LogEntry = { id: nextId++, timestamp: Date.now(), level, source, message, details };
  useLogStore.getState().append(entry);
  mirrorToConsole(entry);
}

type LogFn = (source: string, message: string, details?: LogDetails) => void;

const at =
  (level: LogLevel): LogFn =>
  (source, message, details) =>
    write(level, source, message, details);

export const logger = {
  debug: at('DEBUG'),
  info: at('INFO'),
  data: at('DATA'),
  command: at('COMMAND'),
  success: at('SUCCESS'),
  warn: at('WARN'),
  error: at('ERROR'),
  clear: () => useLogStore.getState().clear(),
};

export interface ReportContext {
  appVersion: string;
  platform: string;
  deviceService: string;
  connection: string;
  deviceName: string | null;
}

/** Plain-text report the client can paste into a message. Oldest entry first. */
export function buildDiagnosticReport(entries: LogEntry[], context: ReportContext): string {
  const title = 'Cooler App Diagnostic Logs';
  const lines = [
    title,
    '='.repeat(title.length),
    `Generated:  ${new Date().toISOString()}`,
    `App:        ${context.appVersion} (${context.platform})`,
    `Service:    ${context.deviceService}`,
    `Connection: ${context.connection}${context.deviceName ? ` (${context.deviceName})` : ''}`,
    `Entries:    ${entries.length}`,
    '',
    ...(entries.length > 0 ? entries.map(formatEntry) : ['(no log entries)']),
  ];
  return lines.join('\n');
}
