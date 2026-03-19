import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--base)' }}>
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom))',
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
