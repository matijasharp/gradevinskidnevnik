import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { Unsubscribe } from '../../../shared/types';

export { supabase, isSupabaseConfigured };

export const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
};

export const subscribeWithFetch = (
  channelName: string,
  table: string,
  filter: string,
  fetcher: () => Promise<void>
): Unsubscribe => {
  ensureSupabase();

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter },
      () => {
        fetcher().catch(() => null);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
