import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Wifi } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await authService.login(data.email, data.password);
      setUser(res.user);
      navigate('/dashboard');
    } catch {
      setError('E-mail ou senha incorretos');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--base)', padding: 24,
    }}>
      {/* Background grid lines — rede topology */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18,
            background: 'var(--accent-dim)', border: '1px solid var(--accent)',
            marginBottom: 16, position: 'relative',
          }}>
            <div className="glow-accent" style={{
              position: 'absolute', inset: -1, borderRadius: 18,
              border: '1px solid var(--accent)', opacity: 0.4,
            }} />
            <Wifi size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: -0.3 }}>
            ISP Manager
          </h1>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>
            Gestão de Provedor de Internet
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--bde)',
          borderRadius: 20, padding: 28,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 24 }}>
            Entrar na conta
          </h2>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 10,
              background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 13, color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--t2)', marginBottom: 6 }}>
                E-mail
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@provedor.com.br"
                autoComplete="email"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  background: 'var(--s2)', border: '1px solid var(--bd)',
                  color: 'var(--t1)', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
              {errors.email && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--t2)', marginBottom: 6 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '12px 42px 12px 14px', borderRadius: 10,
                    background: 'var(--s2)', border: '1px solid var(--bd)',
                    color: 'var(--t1)', fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 4, padding: '13px 0', borderRadius: 10,
                background: isSubmitting ? 'var(--s3)' : 'var(--accent)',
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: isSubmitting ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
                boxShadow: isSubmitting ? 'none' : '0 0 24px var(--accent-glow)',
              }}
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : 'Entrar'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginTop: 20 }}>
            Problema para acessar? Contate o administrador.
          </p>
        </div>

        {/* Version */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 20 }}>
          v1.0.0
        </p>
      </div>
    </div>
  );
}
