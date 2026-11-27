import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { mobileApiClient } from '../services/api';
import { UyirinaiTheme } from '../constants/theme';

interface Notice {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationFeed() {
  const { user } = useAuth();
  const query = useQuery<Notice[]>({
    queryKey: ['notifications', user?.id], enabled: !!user, refetchInterval: 30_000,
    queryFn: async () => (await mobileApiClient.notifications.getNotifications()).data ?? [],
  });
  const read = useMutation({
    mutationFn: (id: string) => id
      ? mobileApiClient.notifications.markAsRead(id)
      : mobileApiClient.notifications.markAllAsRead(),
    onSuccess: () => query.refetch(),
  });
  return <ScrollView contentContainerStyle={styles.page}
    refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
    {query.isPending && <Text>Loading notifications…</Text>}
    {query.isError && <Text accessibilityRole="alert" onPress={() => void query.refetch()}>{query.error.message} Tap to retry.</Text>}
    {read.isError && <Text accessibilityRole="alert">{read.error.message}</Text>}
    {query.data?.length === 0 && <Text>No notifications yet.</Text>}
    {query.data?.some((notice) => !notice.isRead) && <Pressable disabled={read.isPending} onPress={() => read.mutate('')}>
      <Text style={styles.link}>Mark all as read</Text>
    </Pressable>}
    {query.data?.map((notice) => <Pressable key={notice.id} disabled={notice.isRead || read.isPending}
      accessibilityRole="button" style={[styles.card, !notice.isRead && styles.unread]} onPress={() => read.mutate(notice.id)}>
      <Text style={styles.title}>{notice.title}</Text>
      <Text>{notice.message}</Text>
      <Text>{new Date(notice.createdAt).toLocaleString()} · {notice.isRead ? 'Read' : 'Unread'}</Text>
    </Pressable>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 16, gap: 10, backgroundColor: UyirinaiTheme.colors.background },
  card: { padding: 14, gap: 5, borderRadius: 10, borderWidth: 1, borderColor: UyirinaiTheme.colors.border, backgroundColor: UyirinaiTheme.colors.surface },
  unread: { backgroundColor: UyirinaiTheme.colors.primaryLight, borderColor: UyirinaiTheme.colors.lightLilac },
  title: { fontWeight: '700', color: UyirinaiTheme.colors.heading },
  link: { minHeight: 44, color: UyirinaiTheme.colors.primary, fontWeight: '700' },
});
