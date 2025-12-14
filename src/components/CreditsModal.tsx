import { useState } from 'react';
import { Coins, Sparkles, LogOut, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CREDIT_PACKAGES } from '@/lib/creditPackages';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits: number;
  user: User | null;
  freeRefreshesLeft: number;
}

export function CreditsModal({ open, onOpenChange, currentCredits, user, freeRefreshesLeft }: CreditsModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handlePurchase = async (priceId: string) => {
    console.log('[CreditsModal] handlePurchase called with:', priceId);
    
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    
    setLoadingId(priceId);
    
    try {
      console.log('[CreditsModal] Starting checkout for price:', priceId);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      console.log('[CreditsModal] Got token, calling function...');
      
      const response = await fetch(
        `https://redfryzxusnnpqlwxcoc.supabase.co/functions/v1/create-credit-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ priceId }),
        }
      );
      
      console.log('[CreditsModal] Response status:', response.status);
      
      const data = await response.json();
      console.log('[CreditsModal] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }
      
      if (data?.url) {
        console.log('[CreditsModal] Opening checkout URL');
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to start checkout';
      console.error('[CreditsModal] Checkout error:', message);
      toast.error(message);
    }
    
    setLoadingId(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CreditsModal] handleAuth called');
    setAuthLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast.success('Account created!');
      }
      setEmail('');
      setPassword('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('[CreditsModal] handleSignOut called');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Failed to sign out');
      } else {
        toast.success('Signed out');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleClose = () => {
    console.log('[CreditsModal] handleClose called');
    setLoadingId(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="absolute left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Coins className="h-5 w-5 text-primary" />
            {user ? 'Buy Credits' : 'Sign In to Buy Credits'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Balance display */}
          <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {freeRefreshesLeft > 0 
                ? `${freeRefreshesLeft} free refreshes left today` 
                : user 
                  ? `${currentCredits} credits` 
                  : 'Sign in to buy credits'}
            </span>
          </div>

          {!user ? (
            /* Auth form */
            <form onSubmit={handleAuth} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background"
              />
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </form>
          ) : (
            /* Credit packages */
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{user.email}</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </div>
              
              <div className="grid gap-3">
                {CREDIT_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loadingId !== null}
                    className={`relative flex items-center justify-between rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50 ${
                      pkg.popular 
                        ? 'border-primary/50 bg-primary/5' 
                        : 'border-border bg-background'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 left-4 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        <Sparkles className="h-3 w-3" />
                        Best Value
                      </span>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Coins className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground">{pkg.credits} Credits</div>
                        <div className="text-xs text-muted-foreground">
                          €{(pkg.price / pkg.credits).toFixed(3)} per credit
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-foreground">€{pkg.price.toFixed(2)}</div>
                      {loadingId === pkg.id && (
                        <div className="text-xs text-muted-foreground">Loading...</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          
          <p className="text-center text-xs text-muted-foreground">
            Credits are used for manual image refreshes. Automatic weather updates are free.
          </p>
        </div>
      </div>
    </div>
  );
}
