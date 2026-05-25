import React, { useEffect, useRef, useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';

export default function OrgSwitcher() {
  const { orgs, selectedOrg, setSelectedOrgId } = useOrganization();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (orgs.length === 0) return null;

  if (orgs.length === 1) {
    return (
      <div className="org-switcher org-switcher-single">
        <span className="org-switcher-icon">🏛</span>
        <div className="org-switcher-label">
          <div className="org-switcher-name">{orgs[0].name}</div>
          <div className="org-switcher-plan">{orgs[0].subscription_plan}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-switcher-wrap" ref={ref}>
      <button
        type="button"
        className="org-switcher"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="org-switcher-icon">🏛</span>
        <div className="org-switcher-label">
          <div className="org-switcher-name">{selectedOrg?.name || 'Seleccionar organización'}</div>
          <div className="org-switcher-plan">{selectedOrg?.subscription_plan || '—'}</div>
        </div>
        <span className="org-switcher-chevron">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="org-switcher-menu fade-in" role="listbox">
          {orgs.map(o => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === selectedOrg?.id}
              className={`org-switcher-item ${o.id === selectedOrg?.id ? 'active' : ''}`}
              onClick={() => { setSelectedOrgId(o.id); setOpen(false); }}
            >
              <div className="org-switcher-item-main">
                <strong>{o.name}</strong>
                <span className="text-xs text-secondary">
                  {o.city ? `${o.city}, ${o.country}` : o.country}
                </span>
              </div>
              <span className={`badge ${o.is_active ? 'badge-success' : 'badge-danger'}`}>
                {o.subscription_plan}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
