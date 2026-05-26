import { makeAutoObservable, runInAction } from 'mobx';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

class AuthStore {
  user: User | null = null;
  loading = true;
  loginDialogOpen = false;

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  private async init() {
    // Handle OAuth callback: #access_token hash breaks HashRouter.
    // Save tokens → reload clean → restore from sessionStorage.
    const hash = window.location.hash;
    if (hash?.includes('access_token')) {
      const p = new URLSearchParams(hash.slice(1));
      const at = p.get('access_token');
      const rt = p.get('refresh_token');
      if (at && rt) {
        sessionStorage.setItem('sb-oauth-at', at);
        sessionStorage.setItem('sb-oauth-rt', rt);
      }
      window.location.replace(window.location.pathname + '#/');
      return; // Page reloads
    }

    // Restore session from OAuth callback tokens
    const savedAt = sessionStorage.getItem('sb-oauth-at');
    const savedRt = sessionStorage.getItem('sb-oauth-rt');
    if (savedAt && savedRt) {
      sessionStorage.removeItem('sb-oauth-at');
      sessionStorage.removeItem('sb-oauth-rt');
      await supabase.auth.setSession({ access_token: savedAt, refresh_token: savedRt });
    }

    // Normal session check
    const { data: { session } } = await supabase.auth.getSession();
    runInAction(() => {
      this.user = session?.user ?? null;
      this.loading = false;
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      runInAction(() => {
        this.user = session?.user ?? null;
      });
    });
  }

  async signInWithOAuth(provider: 'github' | 'google') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  }

  async signOut() {
    await supabase.auth.signOut();
    runInAction(() => { this.user = null; this.loginDialogOpen = false; });
  }

  get isLoggedIn() { return !!this.user; }
  get avatarUrl() { return this.user?.user_metadata?.avatar_url as string | undefined; }
  get displayName() { return (this.user?.user_metadata?.user_name || this.user?.email) as string; }
}

export const authStore = new AuthStore();
