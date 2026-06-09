import Canvas from './components/Canvas.tsx';
import ChatPanel from './components/ChatPanel.tsx';
import { useSocket } from './hooks/useSocket.ts';

const PROJECT_ID = 'project-1';

export default function App() {
    useSocket(PROJECT_ID);

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                <Canvas />
            </div>
            <ChatPanel projectId={PROJECT_ID} />
        </div>
    );
}
