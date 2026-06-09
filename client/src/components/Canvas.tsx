import { useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore } from '../store/graphStore.ts';
import { SystemNode } from './SystemNode.tsx';
import { useDrag } from '../hooks/useDrag.ts';

const nodeTypes: NodeTypes = {
    systemNode: SystemNode,
};

function LayoutController() {
    const { fitView } = useReactFlow();
    const needsFitView = useGraphStore((state) => state.needsFitView);
    const setNeedsFitView = useGraphStore((state) => state.setNeedsFitView);

    useEffect(() => {
        if (needsFitView) {
            fitView({ padding: 0.2, duration: 400 });
            setNeedsFitView(false);
        }
    }, [needsFitView, fitView, setNeedsFitView]);

    return null;
}

interface CanvasProps {
    projectId: string;
}

export default function Canvas({ projectId }: CanvasProps) {
    const nodes = useGraphStore((state) => state.nodes);
    const edges = useGraphStore((state) => state.edges);
    const { onNodesChange } = useDrag(projectId);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            proOptions={{ hideAttribution: true }}
        >
            <Background color="#2d2d4e" gap={24} />
            <Controls />
            <MiniMap
                nodeColor="#a78bfa"
                maskColor="rgba(0,0,0,0.6)"
                style={{ background: '#1a1a2e' }}
            />
            <LayoutController />
        </ReactFlow>
    );
}
