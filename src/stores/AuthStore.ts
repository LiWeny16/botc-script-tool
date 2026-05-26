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
    // Set up auth listener FIRST (must exist before any session changes)
    supabase.auth.onAuthStateChange((_event, session) => {
      runInAction(() => {
        this.user = session?.user ?? null;
        if (!this.user) this.loading = false;
      });
    });

    // Handle OAuth callback: Supabase redirects here with #access_token=...
    const hash = window.location.hash;
    if (hash?.includes('access_token')) {
      const p = new URLSearchParams(hash.slice(1));
      const at = p.get('access_token');
      const rt = p.get('refresh_token');
      if (at && rt) {
        // Fire setSession (async). onAuthStateChange will update user when it completes.
        supabase.auth.setSession({ access_token: at, refresh_token: rt });
        // Immediately swap hash so HashRouter renders the correct page.
        window.location.hash = '#/';
        this.loading = false;
      }
      return;
    }

    // Normal session check
    const { data: { session } } = await supabase.auth.getSession();
    runInAction(() => {
      this.user = session?.user ?? null;
      this.loading = false;
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
