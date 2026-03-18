'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface HealthCheck {
  id: string;
  bookmark_id: string;
  status_code: number | null;
  response_time: number | null;
  error_message: string | null;
  checked_at: string;
  created_at: string;
  bookmark: {
    id: string;
    url: string;
    title: string;
    tags: string[] | null;
  };
}

export interface HealthCheckStats {
  total: number;
  healthy: number;
  unhealthy: number;
  pending: number;
  averageResponseTime: number;
}

interface UseHealthChecksOptions {
  bookmarkId?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseHealthChecksReturn {
  healthChecks: HealthCheck[];
  stats: HealthCheckStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  hasMore: boolean;
}

export function useHealthChecks(options: UseHealthChecksOptions = {}): UseHealthChecksReturn {
  const {
    bookmarkId,
    limit = 50,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [stats, setStats] = useState<HealthCheckStats>({
    total: 0,
    healthy: 0,
    unhealthy: 0,
    pending: 0,
    averageResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const supabase = createClient();

  const calculateStats = useCallback((checks: HealthCheck[]): HealthCheckStats => {
    const total = checks.length;
    const healthy = checks.filter(check => 
      check.status_code && check.status_code >= 200 && check.status_code < 400
    ).length;
    const unhealthy = checks.filter(check => 
      check.status_code && (check.status_code < 200 || check.status_code >= 400)
    ).length;
    const pending = checks.filter(check => !check.status_code).length;
    
    const responseTimes = checks
      .filter(check => check.response_time !== null)
      .map(check => check.response_time as number);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    return {
      total,
      healthy,
      unhealthy,
      pending,
      averageResponseTime
    };
  }, []);

  const fetchHealthChecks = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      let query = supabase
        .from('health_checks')
        .select(`
          id,
          bookmark_id,
          status_code,
          response_time,
          error_message,
          checked_at,
          created_at,
          bookmark:bookmarks (
            id,
            url,
            title,
            tags
          )
        `)
        .order('checked_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      if (bookmarkId) {
        query = query.eq('bookmark_id', bookmarkId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const newHealthChecks = data as unknown as HealthCheck[];

      if (reset) {
        setHealthChecks(newHealthChecks);
        setOffset(newHealthChecks.length);
      } else {
        setHealthChecks(prev => [...prev, ...newHealthChecks]);
        setOffset(prev => prev + newHealthChecks.length);
      }

      setHasMore(newHealthChecks.length === limit);
      
      // Calculate stats based on all current health checks
      const allChecks = reset ? newHealthChecks : [...healthChecks, ...newHealthChecks];
      setStats(calculateStats(allChecks));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health checks');
    } finally {
      setLoading(false);
    }
  }, [supabase, bookmarkId, limit, offset, healthChecks, calculateStats]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await fetchHealthChecks(true);
  }, [fetchHealthChecks]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchHealthChecks(false);
  }, [fetchHealthChecks, hasMore, loading]);

  // Initial fetch
  useEffect(() => {
    fetchHealthChecks(true);
  }, [bookmarkId, limit]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  // Real-time subscription for new health checks
  useEffect(() => {
    const channel = supabase
      .channel('health_checks_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'health_checks',
          filter: bookmarkId ? `bookmark_id=eq.${bookmarkId}` : undefined
        },
        async (payload) => {
          // Fetch the complete record with bookmark data
          const { data } = await supabase
            .from('health_checks')
            .select(`
              id,
              bookmark_id,
              status_code,
              response_time,
              error_message,
              checked_at,
              created_at,
              bookmark:bookmarks (
                id,
                url,
                title,
                tags
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setHealthChecks(prev => {
              const updated = [data as unknown as HealthCheck, ...prev];
              setStats(calculateStats(updated));
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, bookmarkId, calculateStats]);

  return {
    healthChecks,
    stats,
    loading,
    error,
    refetch,
    fetchMore,
    hasMore
  };
}