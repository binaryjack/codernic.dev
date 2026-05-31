import { useState } from 'react';

export type ConfirmPending = { label: string; exec: () => void };

export type UseConfirmReturn = {
  pending: ConfirmPending | null;
  ask: (label: string, exec: () => void) => void;
  confirm: () => void;
  cancel: () => void;
};

/** Manages a single pending-confirmation slot. Wire `pending` to `<ConfirmDialog>`. */
export const useConfirm = (): UseConfirmReturn => {
  const [pending, setPending] = useState<ConfirmPending | null>(null);

  const ask = (label: string, exec: () => void) => setPending({ label, exec });
  const confirm = () => {
    pending?.exec();
    setPending(null);
  };
  const cancel = () => setPending(null);

  return { pending, ask, confirm, cancel };
};
