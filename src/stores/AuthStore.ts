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
