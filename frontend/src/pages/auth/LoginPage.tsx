import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import nftLogo from '@/assets/nft-logo.png'

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
      background: 'linear-gradient(160deg, #E8EBF0 0%, #DDE1EA 100%)',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Dot pattern */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.35, pointerEvents: 'none' }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1" fill="#96A3B5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Glow verde suave */}
      <div style={{
        position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(24,194,74,0.10) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Logo — moeda SVG */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-block',
            borderRadius: '50%',
            padding: 6,
            background: 'linear-gradient(145deg, #D0D3D8, #B8BCC4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            marginBottom: 16,
          }}>
            <img src={nftLogo} alt="NFT Telecom" style={{ width: 100, height: 100, display: 'block', borderRadius: '50%' }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--t3)', letterSpacing: 0.4 }}>
            Sistema de Gestão de Provedor
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 24, padding: '32px 28px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
            Bem-vindo de volta
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 24 }}>
            Acesse sua conta para continuar
          </p>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 10,
              background: 'var(--danger-dim)', border: '1px solid rgba(220,38,38,0.20)',
              fontSize: 13, color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 7, letterSpacing: 0.3 }}>
                E-MAIL
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@provedor.com.br"
                autoComplete="email"
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  background: 'var(--s2)', border: `1px solid ${errors.email ? 'var(--danger)' : 'var(--bd)'}`,
                  color: 'var(--t1)', fontSize: 14, outline: 'none',
                }}
              />
              {errors.email && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 7, letterSpacing: 0.3 }}>
                SENHA
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '13px 44px 13px 16px', borderRadius: 12,
                    background: 'var(--s2)', border: `1px solid ${errors.password ? 'var(--danger)' : 'var(--bd)'}`,
                    color: 'var(--t1)', fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 8, padding: '14px 0', borderRadius: 12,
                background: isSubmitting ? 'var(--s3)' : 'var(--accent)',
                border: 'none',
                color: isSubmitting ? 'var(--t3)' : '#fff',
                fontSize: 15, fontWeight: 700,
                cursor: isSubmitting ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(24,194,74,0.35)',
                letterSpacing: 0.4,
              }}
            >
              {isSubmitting
                ? <><Loader2 size={16} className="animate-spin" /> Entrando...</>
                : 'ENTRAR'}
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
