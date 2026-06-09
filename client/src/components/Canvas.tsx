import { ReactFlow, Background, Controls, MiniMap, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore } from '../store/graphStore.ts';
import { SystemNode } from './SystemNode.tsx';

const nodeTypes: NodeTypes = {
    systemNode: SystemNode,
};

export default function Canvas() {
    const nodes = useGraphStore((state) => state.nodes);
    const edges = useGraphStore((state) => state.edges);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
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
