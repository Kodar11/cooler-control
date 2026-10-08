import { create } from 'zustand';

export type ToastTone = 'neutral' | 'success' | 'warning';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toast: Toast | null;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (message, tone = 'neutral') => set({ toast: { id: nextId++, message, tone } }),
  dismiss: (id) => set((state) => (state.toast?.id === id ? { toast: null } : state)),
}));

/** Show a short confirmation from anywhere, including outside React. */
export const showToast = (message: string, tone?: ToastTone) => useToastStore.getState().show(message, tone);
