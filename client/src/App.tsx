import Canvas from './components/Canvas.tsx';
import ChatPanel from './components/ChatPanel.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';
import { useSocket } from './hooks/useSocket.ts';
import { useHistory } from './hooks/useHistory.ts';

const PROJECT_ID = 'project-1';

export default function App() {
    useSocket(PROJECT_ID);
    useHistory(PROJECT_ID);

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                <Canvas />
                <HistoryPanel projectId={PROJECT_ID} />
            </div>
            <ChatPanel projectId={PROJECT_ID} />
        </div>
    );
}
