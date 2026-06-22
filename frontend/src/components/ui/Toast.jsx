import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';

const Toast = ({ message }) => {
  if (!message) return null;

  return createPortal(
    <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-[9999] flex items-center gap-2 animate-in fade-in slide-in-from-top-4 pointer-events-none">
      <CheckCircle2 size={16} /> {message}
    </div>,
    document.body
  );
};

export default Toast;
