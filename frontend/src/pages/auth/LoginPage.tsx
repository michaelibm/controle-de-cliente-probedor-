import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import nftLogo from '../../assets/nft-logo.svg';

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
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />
      {/* Glow radial */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,229,92,0.06) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px 20px', borderRadius: 18,
            background: 'rgba(34,229,92,0.07)',
            border: '1px solid rgba(34,229,92,0.20)',
            marginBottom: 14,
            boxShadow: '0 0 40px rgba(34,229,92,0.12)',
          }}>
            <img src={nftLogo} alt="NFT Telecom" style={{ height: 48, display: 'block' }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>
            Sistema de Gestão de Provedor
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--s1)',
          border: '1px solid var(--bde)',
          borderRadius: 20, padding: 28,
          boxShadow: '0 0 0 1px rgba(34,229,92,0.05), 0 24px 48px rgba(0,0,0,0.4)',
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
                border: 'none', color: '#000', fontSize: 14, fontWeight: 700,
                cursor: isSubmitting ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
                boxShadow: isSubmitting ? 'none' : '0 0 28px var(--accent-glow)',
              }}
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" style={{ color: 'var(--t1)' }} /> Entrando...</> : 'Entrar'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginTop: 20 }}>
            Problema para acessar? Contate o administrador.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 20 }}>
          NFT Telecom · v1.0.0
        </p>
      </div>
    </div>
  );
}
