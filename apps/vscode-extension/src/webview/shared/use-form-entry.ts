import { useState } from 'react';

export type UseFormEntryReturn<T> = {
  entry: T;
  setEntry: React.Dispatch<React.SetStateAction<T>>;
  field: (key: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export const useFormEntry = function <T>(initial: T): UseFormEntryReturn<T> {
  const [entry, setEntry] = useState<T>(initial);

  const field = (key: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEntry((prev) => ({ ...prev, [key]: e.target.value }));

  return { entry, setEntry, field };
};
