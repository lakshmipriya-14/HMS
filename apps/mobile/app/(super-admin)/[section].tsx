import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { SuperAdminWorkspace, superAdminSections } from '../../components/SuperAdminWorkspace';

export default function Section() {
  const {section,id,branchId} = useLocalSearchParams<{section:string;id?:string;branchId?:string}>();
  if (!superAdminSections.includes(section)) return <Redirect href={"/(super-admin)/more" as any}/>;
  return <SuperAdminWorkspace section={section} id={id} branchId={branchId}/>;
}
