import { Button } from '@ai-agencee/ui/atoms';

type Props = {
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
};

export const EditorActionBar = ({
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
}: Props) => (
  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
    <Button type="submit" variant="primary" size="sm">
      {saveLabel}
    </Button>
    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
      {cancelLabel}
    </Button>
  </div>
);
