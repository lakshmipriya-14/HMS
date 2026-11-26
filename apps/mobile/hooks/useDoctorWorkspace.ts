import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { mobileApiClient } from '../services/api';

export function useDoctorWorkspace() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['doctor-workspace', user?.hospitalId, user?.id],
    enabled: !!user?.doctorProfileId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await mobileApiClient.doctor.getWorkspace();
      if (!response.data) throw new Error('Doctor workspace is unavailable.');
      return response.data;
    },
  });
}
