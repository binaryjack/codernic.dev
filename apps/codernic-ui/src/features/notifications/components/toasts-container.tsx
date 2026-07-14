import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
import { selectActiveToasts, removeActiveToast } from '../../../entities/notifications/model/notifications-slice';
import { Toast } from '@ai-agencee/ui';

export function ToastsContainer() {
  const toasts = useSelector(selectActiveToasts);
  const dispatch = useDispatch();

  const handleClose = (id: string) => {
    dispatch(removeActiveToast(id));
  };

  const content = (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast data-testid={`${typeof currentId !== 'undefined' ? currentId : 'toasts-item'}-toast`} 
            level={toast.level} 
            message={toast.message} 
            onClose={() => handleClose(toast.id)} 
          />
        </div>
      ))}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
