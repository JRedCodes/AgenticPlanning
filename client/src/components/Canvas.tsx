import { ReactFlow, Background, Controls, MiniMap, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore } from '../store/graphStore.ts';
import { SystemNode } from './SystemNode.tsx';
import { useDrag } from '../hooks/useDrag.ts';

const nodeTypes: NodeTypes = {
    systemNode: SystemNode,
};

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
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
        >
            <Background color="#2d2d4e" gap={24} />
            <Controls />
            <MiniMap
                nodeColor="#a78bfa"
                maskColor="rgba(0,0,0,0.6)"
                style={{ background: '#1a1a2e' }}
            />
        </ReactFlow>
    );
}
