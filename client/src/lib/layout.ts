import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode } from 'elkjs';
import type { Node, Edge } from '@xyflow/react';
import type { SystemNodeData } from '../store/graphStore.ts';

const elk = new ELK();

const NODE_WIDTH = 240;
const NODE_HEIGHT = 80;

export async function applyElkLayout(
    nodes: Node<SystemNodeData>[],
    edges: Edge[]
): Promise<Node<SystemNodeData>[]> {
    if (nodes.length === 0) return nodes;

    const elkGraph: ElkNode = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '80',
            'elk.layered.spacing.nodeNodeBetweenLayers': '120',
            'elk.padding': '[top=40,left=40,bottom=40,right=40]',
        },
        children: nodes.map(n => ({
            id: n.id,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        })),
        edges: edges.map(e => ({
            id: e.id,
            sources: [e.source],
            targets: [e.target],
        })),
    };

    const layout = await elk.layout(elkGraph);

    return nodes.map(n => {
        const elkNode = layout.children?.find(c => c.id === n.id);
        if (elkNode?.x == null || elkNode?.y == null) return n;
        return { ...n, position: { x: elkNode.x, y: elkNode.y } };
    });
}
