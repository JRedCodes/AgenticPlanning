import Canvas from './components/Canvas.tsx';
import ChatPanel from './components/ChatPanel.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';
import AuthModal from './components/AuthModal.tsx';
import { useSocket } from './hooks/useSocket.ts';
import { useHistory } from './hooks/useHistory.ts';
import { useProject } from './hooks/useProject.ts';
import { useAuthStore } from './store/authStore.ts';

function Workspace() {
    const projectId = useProject();

    useSocket(projectId ?? '');
    useHistory(projectId ?? '');

    if (!projectId) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                color: '#64748b',
                fontSize: 14,
            }}>
                Connecting...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                <Canvas projectId={projectId} />
                <HistoryPanel projectId={projectId} />
            </div>
            <ChatPanel projectId={projectId} />
        </div>
    );
}

export default function App() {
    const token = useAuthStore((state) => state.token);
    if (!token) return <AuthModal />;
    return <Workspace />;
}
