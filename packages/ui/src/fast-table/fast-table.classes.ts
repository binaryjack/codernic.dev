/** BEM-style class names for FastTable elements */
export const fastTableClasses = {
  root:           'ft-root',
  scrollContainer:'ft-scroll-container',
  headerRow:      'ft-header-row',
  headerCell:     'ft-header-cell',
  headerCellSort: 'ft-header-cell--sortable',
  sortIconAsc:    'ft-sort-icon--asc',
  sortIconDesc:   'ft-sort-icon--desc',
  selectionCell:  'ft-selection-cell',
  row:            'ft-row',
  rowActive:      'ft-row--active',
  rowSelected:    'ft-row--selected',
  cell:           'ft-cell',
  cellDisplay:    'ft-cell-display',
  loadingOverlay: 'ft-loading-overlay',
} as const
