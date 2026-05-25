import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Organization } from '../types';
import { orgService } from '../services/api';
import { useAuth } from './AuthContext';

interface OrgCtx {
  orgs: Organization[];
  selectedOrgId: string | null;
  selectedOrg: Organization | null;
  setSelectedOrgId: (id: string) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const OrganizationContext = createContext<OrgCtx | undefined>(undefined);

const STORAGE_KEY = 'empresa_selected_org';

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await orgService.list();
      const list: Organization[] = data.results || data;
      setOrgs(list);

      const stored = localStorage.getItem(STORAGE_KEY);
      const storedExists = stored && list.some(o => o.id === stored);

      if (!storedExists && list.length > 0) {
        setSelectedOrgIdState(list[0].id);
        localStorage.setItem(STORAGE_KEY, list[0].id);
      } else if (list.length === 0) {
        setSelectedOrgIdState(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refresh();
    else {
      setOrgs([]);
      setSelectedOrgIdState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isAuthenticated, refresh]);

  const setSelectedOrgId = (id: string) => {
    setSelectedOrgIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedOrg = orgs.find(o => o.id === selectedOrgId) || null;

  return (
    <OrganizationContext.Provider
      value={{ orgs, selectedOrgId, selectedOrg, setSelectedOrgId, isLoading, refresh }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used inside OrganizationProvider');
  return ctx;
}
