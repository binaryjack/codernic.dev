'use client'

import { CheckBox } from '../../form/check-box.js'
import { Input } from '../../form/input.js'
import { Select } from '../../form/select.js'
import { useFormularField } from '../../formular-bridge/use-formular-field.js'
import type { CellEditorDef } from '../types.js'
import { useTestId } from '../../hooks/useTestId';

interface CellEditorProps {
  name:   string
  editor: CellEditorDef<unknown>
  dataTestId?: string;
}

export function CellEditor({ dataTestId, name, editor }: CellEditorProps) {
  // Required for the 'custom' case; hook must be called unconditionally
  
  const { rootId, getTestId } = useTestId('cell-editor', dataTestId);
const field = useFormularField(name)

  switch (editor.type) {
    case 'text':
      return <Input data-testid={getTestId('input')} name={name} type="text" placeholder={editor.placeholder} />

    case 'email':
      return <Input data-testid={getTestId('input-1')} name={name} type="email" />

    case 'password':
      return <Input data-testid={getTestId('input-2')} name={name} type="password" />

    case 'number':
      return <Input data-testid={getTestId('input-3')} name={name} type="number" />

    case 'checkbox':
      return <CheckBox data-testid={getTestId('check-box')} name={name} />

    case 'select':
      return <Select data-testid={getTestId('select')} name={name} options={editor.options} />

    case 'custom':
      return <>{editor.render(field)}</>

    default:
      return null
  }
}
