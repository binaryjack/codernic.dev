'use client'

import { CheckBox } from '../../form/check-box.js'
import { Input } from '../../form/input.js'
import { Select } from '../../form/select.js'
import { useFormularField } from '../../formular-bridge/use-formular-field.js'
import type { CellEditorDef } from '../types.js'

interface CellEditorProps {
  name:   string
  editor: CellEditorDef<unknown>
}

export function CellEditor({ name, editor }: CellEditorProps) {
  // Required for the 'custom' case; hook must be called unconditionally
  const field = useFormularField(name)

  switch (editor.type) {
    case 'text':
      return <Input name={name} type="text" placeholder={editor.placeholder} />

    case 'email':
      return <Input name={name} type="email" />

    case 'password':
      return <Input name={name} type="password" />

    case 'number':
      return <Input name={name} type="number" />

    case 'checkbox':
      return <CheckBox name={name} />

    case 'select':
      return <Select name={name} options={editor.options} />

    case 'custom':
      return <>{editor.render(field)}</>

    default:
      return null
  }
}
