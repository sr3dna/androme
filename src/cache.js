import NodeList from './nodelist';

export const NODE_CACHE = new NodeList();

export function generateNodeId() {
    return NODE_CACHE.length + 1;
}