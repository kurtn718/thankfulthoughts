'use client';
import { useTranslation } from '@/hooks/useTranslation';

export default function DeleteConfirmModal({ isOpen, onConfirm, onCancel }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{t('savedThoughts.deletePrompt.title')}</h3>
        <p className="py-4">{t('savedThoughts.deletePrompt.message')}</p>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onCancel}>
            {t('savedThoughts.deletePrompt.cancel')}
          </button>
          <button className="btn btn-error" onClick={onConfirm}>
            {t('savedThoughts.deletePrompt.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
} 