import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

const FREE_DAILY_REFRESHES = 3;
const DAILY_KEY = 'mineclima_daily_refreshes';

interface DailyData {
  date: string;
  count: number;
}

export function useCredits() {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyRefreshes, setDailyRefreshes] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  // Get daily refreshes from localStorage for anonymous users
  const getDailyData = useCallback((): DailyData => {
    try {
      const stored = localStorage.getItem(DAILY_KEY);
      if (stored) {
        const data = JSON.parse(stored) as DailyData;
        if (data.date === today) {
          return data;
        }
      }
    } catch (e) {
      console.error('Error reading daily data:', e);
    }
    return { date: today, count: 0 };
  }, [today]);

  const setDailyData = useCallback((count: number) => {
    localStorage.setItem(DAILY_KEY, JSON.stringify({ date: today, count }));
    setDailyRefreshes(count);
  }, [today]);

  // Fetch user credits from database
  const fetchCredits = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setCredits(data.credits || 0);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await fetchCredits(session.user.id);
      }
      
      const daily = getDailyData();
      setDailyRefreshes(daily.count);
      setLoading(false);
    };

    init();

    // Listen for auth changes - IMPORTANT: Don't make Supabase calls inside this callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only do synchronous state updates here
      if (session?.user) {
        setUser(session.user);
        // Defer Supabase calls with setTimeout to avoid deadlock
        setTimeout(() => {
          fetchCredits(session.user.id);
        }, 0);
      } else {
        setUser(null);
        setCredits(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchCredits, getDailyData]);

  // Check if user can refresh (has free refreshes or credits)
  const canRefresh = useCallback(() => {
    if (dailyRefreshes < FREE_DAILY_REFRESHES) {
      return { allowed: true, useFreeRefresh: true };
    }
    if (user && credits > 0) {
      return { allowed: true, useFreeRefresh: false };
    }
    if (!user) {
      return { allowed: false, useFreeRefresh: false, needsAuth: true };
    }
    return { allowed: false, useFreeRefresh: false, needsCredits: true };
  }, [dailyRefreshes, credits, user]);

  // Use a refresh
  const useRefresh = useCallback(async () => {
    const check = canRefresh();
    
    if (!check.allowed) {
      return false;
    }

    if (check.useFreeRefresh) {
      setDailyData(dailyRefreshes + 1);
      return true;
    }

    // Deduct a credit
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: credits - 1 })
        .eq('id', user.id);

      if (!error) {
        setCredits(credits - 1);
        
        // Log transaction
        await supabase.from('credit_transactions').insert({
          user_id: user.id,
          amount: -1,
          type: 'usage',
          description: 'Manual image refresh',
        });
        
        return true;
      }
    }

    return false;
  }, [canRefresh, dailyRefreshes, credits, user, setDailyData]);

  const refreshCredits = useCallback(async () => {
    if (user) {
      await fetchCredits(user.id);
    }
  }, [user, fetchCredits]);

  return {
    user,
    credits,
    loading,
    dailyRefreshes,
    freeRefreshesLeft: Math.max(0, FREE_DAILY_REFRESHES - dailyRefreshes),
    canRefresh,
    useRefresh,
    refreshCredits,
  };
}
