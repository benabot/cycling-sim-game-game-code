import { describe, it, expect, vi, beforeEach } from 'vitest';

const signUpMock = vi.fn();
const rpcMock = vi.fn();
const mockSupabase = {
  auth: {
    signUp: signUpMock
  },
  rpc: rpcMock,
  from: vi.fn()
};

vi.mock('../../src/lib/supabase.js', () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: () => true
}));

describe('useAuth register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcMock.mockResolvedValue({ data: true, error: null });
    signUpMock.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null
    });
  });

  it('passes username in metadata and skips profile insert', async () => {
    const { useAuth } = await import('../../src/composables/useAuth.js');
    const { register } = useAuth();

    const result = await register('test@example.com', 'password123', 'PlayerOne');

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: { username: 'PlayerOne' }
      }
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(result.confirmationRequired).toBe(true);
  });
});
