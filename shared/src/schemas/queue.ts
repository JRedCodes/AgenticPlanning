export interface ExistingNode {
    id: string;
    title: string;
    dependencies: string[];
}

export interface ChatJobData {
    projectId: string;
    userId: string;
    message: string;
    existingNodes?: ExistingNode[];
}
