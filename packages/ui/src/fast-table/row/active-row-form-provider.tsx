'use client'

import type { ReactNode } from 'react'
import type { IFormularLike, SchemaLike } from '../../formular-bridge/form-provider.js'
import { FormProvider } from '../../formular-bridge/form-provider.js'

interface ActiveRowFormProviderProps {
  form:     IFormularLike
  schema:   SchemaLike
  children: ReactNode
}

/** Thin wrapper — seeds a FormProvider around the active row's editor slots. */
export function ActiveRowFormProvider({ form, schema, children }: ActiveRowFormProviderProps) {
  return (
    <FormProvider form={form} schema={schema}>
      {children}
    </FormProvider>
  )
}
