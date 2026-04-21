import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface CorporationState {
  corporationCd: string;
  corporationNm: string;
  setCorporation: (cd: string, nm: string) => void;
}

const CorporationContext = createContext<CorporationState | null>(null);

export function CorporationProvider({ children }: { children: ReactNode }) {
  const [corporationCd, setCorporationCd] = useState('');
  const [corporationNm, setCorporationNm] = useState('');

  const setCorporation = useCallback((cd: string, nm: string) => {
    setCorporationCd(cd);
    setCorporationNm(nm);
  }, []);

  return (
    <CorporationContext.Provider value={{ corporationCd, corporationNm, setCorporation }}>
      {children}
    </CorporationContext.Provider>
  );
}

export function useCorporationStore() {
  const ctx = useContext(CorporationContext);
  if (!ctx) throw new Error('useCorporationStore must be used inside CorporationProvider');
  return ctx;
}
