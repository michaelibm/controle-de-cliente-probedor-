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
      background: 'var(--base)', padding: 24, position: 'relative', overflow: 'hidden',
    }}>

      {/* Network dot pattern */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.12, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="#22E55C" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Network lines (decorative) */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="20%" x2="100%" y2="60%" stroke="#22E55C" strokeWidth="1" />
        <line x1="10%" y1="0" x2="80%" y2="100%" stroke="#22E55C" strokeWidth="1" />
        <line x1="100%" y1="10%" x2="20%" y2="90%" stroke="#22E55C" strokeWidth="1" />
        <line x1="50%" y1="0" x2="30%" y2="100%" stroke="#22E55C" strokeWidth="0.5" />
        <circle cx="30%" cy="35%" r="3" fill="#22E55C" opacity="0.5" />
        <circle cx="70%" cy="20%" r="2" fill="#22E55C" opacity="0.4" />
        <circle cx="15%" cy="70%" r="2.5" fill="#22E55C" opacity="0.4" />
        <circle cx="85%" cy="65%" r="2" fill="#22E55C" opacity="0.3" />
      </svg>

      {/* Radial glow top */}
      <div style={{
        position: 'fixed', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(34,229,92,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '14px 24px', borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(34,229,92,0.10) 0%, rgba(34,229,92,0.04) 100%)',
            border: '1px solid rgba(34,229,92,0.25)',
            marginBottom: 16,
            boxShadow: '0 0 40px rgba(34,229,92,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <img src={nftLogo} alt="NFT Telecom" style={{ height: 52, display: 'block' }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--t3)', letterSpacing: 0.3 }}>
            Sistema de Gestão de Provedor
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'linear-gradient(145deg, var(--s1) 0%, var(--s2) 100%)',
          border: '1px solid var(--bde)',
          borderRadius: 24, padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,229,92,0.06)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
            Bem-vindo de volta
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 24 }}>
            Acesse sua conta para continuar
          </p>

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
                  background: 'var(--s3)', border: `1px solid ${errors.email ? 'var(--danger)' : 'var(--bd)'}`,
                  color: 'var(--t1)', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s',
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
                    background: 'var(--s3)', border: `1px solid ${errors.password ? 'var(--danger)' : 'var(--bd)'}`,
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
                background: isSubmitting
                  ? 'var(--s3)'
                  : 'linear-gradient(135deg, #22E55C 0%, #18BB48 100%)',
                border: 'none', color: '#0A1A0F', fontSize: 15, fontWeight: 700,
                cursor: isSubmitting ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
                boxShadow: isSubmitting ? 'none' : '0 4px 24px rgba(34,229,92,0.40)',
                letterSpacing: 0.3,
              }}
            >
              {isSubmitting
                ? <><Loader2 size={16} className="animate-spin" style={{ color: 'var(--t2)' }} /> Entrando...</>
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
