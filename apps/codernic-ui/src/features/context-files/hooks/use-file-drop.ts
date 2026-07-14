import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addContextFile, selectIsDragging, setIsDragging } from '../../chat/store/chat.slice';

export function useFileDrop() {
  const dispatch = useDispatch();
  const isDragging = useSelector(selectIsDragging);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      dispatch(setIsDragging(true));
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.relatedTarget || (e.relatedTarget as Element).nodeName === 'HTML') {
        dispatch(setIsDragging(false));
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(setIsDragging(false));

      let rawUris: string[] = [];
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach((file) => {
          // @ts-expect-error path is non-standard but present in some webkit environments
          const path = file.path || file.name;
          if (path) rawUris.push(path);
        });
      }

      const uriList = e.dataTransfer?.getData('text/uri-list');
      const plainText = e.dataTransfer?.getData('text/plain');
      const vscodeTreePayload = e.dataTransfer?.getData(
        'application/vnd.code.tree.workspaceExplorer',
      );

      if (vscodeTreePayload) {
        try {
          const parsed = JSON.parse(vscodeTreePayload) as Array<{ fsPath?: string } | string>;
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (typeof item === 'string') rawUris.push(item);
              else if (item.fsPath) rawUris.push(item.fsPath);
            });
          }
        } catch {
          /* skip */
        }
      }

      if (uriList) rawUris.push(...uriList.split(/\r?\n/).map((l) => l.trim()));
      else if (plainText) {
        try {
          const parsed = JSON.parse(plainText) as Array<
            { fsPath?: string; path?: string } | string
          >;
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (typeof item === 'string') rawUris.push(item);
              else if (item.fsPath) rawUris.push(item.fsPath);
              else if (item.path) rawUris.push(item.path);
            });
          } else {
            rawUris.push(...plainText.split(/\r?\n/).map((l) => l.trim()));
          }
        } catch {
          rawUris.push(...plainText.split(/\r?\n/).map((l) => l.trim()));
        }
      }

      rawUris = rawUris.filter((l) => l.length > 0);
      rawUris.forEach((rawUri) => {
        let cleanPath = rawUri;
        if (cleanPath.startsWith('file://')) {
          cleanPath = cleanPath.replace(/^file:\/\/\/?/, '/');
        }
        const fileName = cleanPath.split(/[/\\]/).pop() || cleanPath;

        dispatch(
          addContextFile({ id: String(Date.now() + Math.random()), filePath: cleanPath, fileName }),
        );
      });
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [dispatch]);

  return { isDragging };
}
