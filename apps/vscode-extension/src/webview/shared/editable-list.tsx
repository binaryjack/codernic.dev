import { Button } from '@ai-agencee/ui/atoms';
import { INPUT_STYLE, LABEL_STYLE } from './form-styles';

type Props = {
  label: string;
  addLabel: string;
  items: string[];
  onAdd: () => void;
  onChange: (idx: number, val: string) => void;
  onRemove: (idx: number, val: string) => void;
};

export const EditableList = function ({
  label,
  addLabel,
  items,
  onAdd,
  onChange,
  onRemove,
}: Props) {
  return (
    <div>
      <div style={{ ...LABEL_STYLE, marginBottom: 4 }}>{label}</div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <input style={INPUT_STYLE} value={item} onChange={(e) => onChange(i, e.target.value)} />
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(i, item)}>
            ✕
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
        {addLabel}
      </Button>
    </div>
  );
};
