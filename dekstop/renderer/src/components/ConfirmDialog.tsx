import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50 animate-scale-in">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-100' : 'bg-orange-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-gray-600">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Dialog.Close className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
              {cancelText}
            </Dialog.Close>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                variant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}