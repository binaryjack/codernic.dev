import { useSelector } from 'react-redux';
import { selectIsAppLoading } from '../../entities/app/model/app-slice';

// If logo is in public folder, we might reference it via absolute path or import from assets.
import logoUrl from '../../assets/ai-agencee-logo-dark.svg';

export function GlobalLoader() {
  const isLoading = useSelector(selectIsAppLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center">
        {/* The Codernic Logo with a pulse animation and an amber tint drop-shadow */}
        <img 
          src={logoUrl} 
          alt="Codernic Loading" 
          className="w-24 h-24 animate-pulse"
          style={{ filter: 'drop-shadow(0 0 15px theme("colors.codernic.amber.500"))' }}
        />
        <div className="mt-4 flex space-x-1 items-center">
          <div className="w-2 h-2 rounded-full bg-codernic-amber-500 animate-[bounce_1s_infinite_-0.3s]"></div>
          <div className="w-2 h-2 rounded-full bg-codernic-amber-500 animate-[bounce_1s_infinite_-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-codernic-amber-500 animate-[bounce_1s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}
