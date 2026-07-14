'use client'

import type { ReactNode } from 'react'
import type { IFormularLike, SchemaLike } from '../../formular-bridge/form-provider.js'
import { FormProvider } from '../../formular-bridge/form-provider.js'
import { useTestId } from '../../hooks/useTestId';

interface ActiveRowFormProviderProps {
  form:     IFormularLike
  schema:   SchemaLike
  children: ReactNode
  dataTestId?: string;
}

/** Thin wrapper — seeds a FormProvider around the active row's editor slots. */
export function ActiveRowFormProvider({ dataTestId, form, schema, children }: ActiveRowFormProviderProps) {
  
  const { rootId, getTestId } = useTestId('active-row-form-provider', dataTestId);
return (
    <FormProvider data-testid={getTestId('form-provider')} form={form} schema={schema}>
      {children}
    </FormProvider>
  )
}
