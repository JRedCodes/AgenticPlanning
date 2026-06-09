import { db } from './db.js';
import type { GraphState, GraphNode, GraphEdge, NodeData } from '@project/shared';
import type { PoolClient } from 'pg';

export class ConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}

export interface CommitRecord {
    id: string;
    parentCommitId: string | null;
    commitMessage: string;
    createdAt: Date;
}

export interface ProjectState {
    commitId: string;
    parentCommitId: string | null;
    graphState: GraphState;
}

async function insertNodes(client: PoolClient, commitId: string, nodes: GraphNode[]): Promise<void> {
    if (nodes.length === 0) return;
    const values: unknown[] = [];
    const placeholders = nodes.map((node, i) => {
        const b = i * 6;
        values.push(commitId, node.id, node.type, node.position.x, node.position.y, node.data);
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6})`;
    });
    await client.query(
        `INSERT INTO graph_nodes (commit_id, node_id, type, position_x, position_y, data)
         VALUES ${placeholders.join(', ')}`,
        values
    );
}

async function insertEdges(client: PoolClient, commitId: string, edges: GraphEdge[]): Promise<void> {
    if (edges.length === 0) return;
    const values: unknown[] = [];
    const placeholders = edges.map((edge, i) => {
        const b = i * 5;
        values.push(commitId, edge.id, edge.source, edge.target, edge.type ?? null);
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`;
    });
    await client.query(
        `INSERT INTO graph_edges (commit_id, edge_id, source_id, target_id, type)
         VALUES ${placeholders.join(', ')}`,
        values
    );
}

export async function createCommit(
    projectId: string,
    parentCommitId: string | null,
    message: string,
    graphState: GraphState
): Promise<string> {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const commitResult = await client.query<{ id: string }>(
            `INSERT INTO project_commits (project_id, parent_commit_id, commit_message)
             VALUES ($1, $2, $3) RETURNING id`,
            [projectId, parentCommitId, message]
        );
        const commitId = commitResult.rows[0]?.id;
        if (!commitId) throw new Error('Insert did not return a commit ID');

        await insertNodes(client, commitId, graphState.nodes);
        await insertEdges(client, commitId, graphState.edges);

        await client.query(
            `INSERT INTO project_heads (project_id, current_commit_id) VALUES ($1, $2)
             ON CONFLICT (project_id) DO UPDATE SET current_commit_id = EXCLUDED.current_commit_id`,
            [projectId, commitId]
        );

        await client.query('COMMIT');
        return commitId;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function rollback(projectId: string, commitId: string): Promise<void> {
    const result = await db.query(
        `UPDATE project_heads SET current_commit_id = $2
         WHERE project_id = $1
         AND EXISTS (
             SELECT 1 FROM project_commits WHERE id = $2 AND project_id = $1
         )`,
        [projectId, commitId]
    );
    if (result.rowCount === 0) {
        throw new Error(`Commit ${commitId} not found on project ${projectId}`);
    }
}

export async function getCurrentState(projectId: string): Promise<ProjectState | null> {
    const headResult = await db.query<{ current_commit_id: string; parent_commit_id: string | null }>(
        `SELECT ph.current_commit_id, pc.parent_commit_id
         FROM project_heads ph
         JOIN project_commits pc ON pc.id = ph.current_commit_id
         WHERE ph.project_id = $1`,
        [projectId]
    );
    const head = headResult.rows[0];
    if (!head) return null;

    const [nodesResult, edgesResult] = await Promise.all([
        db.query<{ node_id: string; type: string; position_x: number; position_y: number; data: NodeData }>(
            `SELECT node_id, type, position_x, position_y, data
             FROM graph_nodes WHERE commit_id = $1`,
            [head.current_commit_id]
        ),
        db.query<{ edge_id: string; source_id: string; target_id: string; type: string | null }>(
            `SELECT edge_id, source_id, target_id, type
             FROM graph_edges WHERE commit_id = $1`,
            [head.current_commit_id]
        ),
    ]);

    return {
        commitId: head.current_commit_id,
        parentCommitId: head.parent_commit_id,
        graphState: {
            nodes: nodesResult.rows.map(n => ({
                id: n.node_id,
                type: n.type,
                position: { x: n.position_x, y: n.position_y },
                data: n.data,
            })),
            edges: edgesResult.rows.map(e => ({
                id: e.edge_id,
                source: e.source_id,
                target: e.target_id,
                ...(e.type ? { type: e.type } : {}),
            })),
            versionId: head.current_commit_id,
            parentVersionId: head.parent_commit_id,
        },
    };
}

export async function getCommitHistory(projectId: string): Promise<CommitRecord[]> {
    const { rows } = await db.query<{
        id: string;
        parent_commit_id: string | null;
        commit_message: string;
        created_at: Date;
    }>(
        `SELECT id, parent_commit_id, commit_message, created_at
         FROM project_commits WHERE project_id = $1
         ORDER BY created_at DESC`,
        [projectId]
    );
    return rows.map(r => ({
        id: r.id,
        parentCommitId: r.parent_commit_id,
        commitMessage: r.commit_message,
        createdAt: r.created_at,
    }));
}

export async function createCommitWithLock(
    projectId: string,
    expectedCommitId: string,
    message: string,
    positionUpdates: Array<{ nodeId: string; position: { x: number; y: number } }>
): Promise<string> {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const headResult = await client.query<{ current_commit_id: string }>(
            `SELECT current_commit_id FROM project_heads WHERE project_id = $1 FOR UPDATE`,
            [projectId]
        );
        const currentCommitId = headResult.rows[0]?.current_commit_id;
        if (!currentCommitId) throw new Error('Project head not found');
        if (currentCommitId !== expectedCommitId) {
            throw new ConflictError('Canvas was updated by another operation — please retry');
        }

        const [nodesResult, edgesResult] = await Promise.all([
            client.query<{ node_id: string; type: string; position_x: number; position_y: number; data: NodeData }>(
                `SELECT node_id, type, position_x, position_y, data FROM graph_nodes WHERE commit_id = $1`,
                [currentCommitId]
            ),
            client.query<{ edge_id: string; source_id: string; target_id: string; type: string | null }>(
                `SELECT edge_id, source_id, target_id, type FROM graph_edges WHERE commit_id = $1`,
                [currentCommitId]
            ),
        ]);

        const positionMap = new Map(positionUpdates.map(u => [u.nodeId, u.position]));

        const updatedNodes: GraphNode[] = nodesResult.rows.map(n => {
            const newPos = positionMap.get(n.node_id);
            return {
                id: n.node_id,
                type: n.type,
                position: newPos ?? { x: n.position_x, y: n.position_y },
                data: n.data,
            };
        });

        const currentEdges: GraphEdge[] = edgesResult.rows.map(e => ({
            id: e.edge_id,
            source: e.source_id,
            target: e.target_id,
            ...(e.type ? { type: e.type } : {}),
        }));

        const commitResult = await client.query<{ id: string }>(
            `INSERT INTO project_commits (project_id, parent_commit_id, commit_message)
             VALUES ($1, $2, $3) RETURNING id`,
            [projectId, currentCommitId, message]
        );
        const newCommitId = commitResult.rows[0]?.id;
        if (!newCommitId) throw new Error('Insert did not return a commit ID');

        await insertNodes(client, newCommitId, updatedNodes);
        await insertEdges(client, newCommitId, currentEdges);

        await client.query(
            `UPDATE project_heads SET current_commit_id = $2 WHERE project_id = $1`,
            [projectId, newCommitId]
        );

        await client.query('COMMIT');
        return newCommitId;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
