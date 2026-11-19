import React from 'react';
import { Role } from '@multispeciality-hms/contracts';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  badge?: string;
}
