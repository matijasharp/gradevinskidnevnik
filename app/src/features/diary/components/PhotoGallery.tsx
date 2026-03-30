import React, { useState, useEffect } from 'react';
import { subscribeDiaryPhotos } from '../../../lib/data';
import { handleFirestoreError, OperationType } from '../../../shared/utils/error';
import type { DiaryPhoto } from '../../../shared/types';

export default function PhotoGallery({ entryId, onPhotoClick }: { entryId: string, onPhotoClick?: (photo: DiaryPhoto) => void }) {
  const [photos, setPhotos] = useState<DiaryPhoto[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeDiaryPhotos(
      entryId,
      setPhotos,
      (error) => handleFirestoreError(error, OperationType.LIST, 'diaryPhotos')
    );
    return unsubscribe;
  }, [entryId]);

  if (photos.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {photos.map(p => (
        <div
          key={p.id}
          className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100 relative group cursor-pointer"
          onClick={(e) => {
            if (onPhotoClick) {
              e.stopPropagation();
              onPhotoClick(p);
            }
          }}
        >
          <img src={p.url} className="w-full h-full object-cover" alt="Site" referrerPolicy="no-referrer" />
          {p.description && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
              <p className="text-[8px] text-white text-center line-clamp-2">{p.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
