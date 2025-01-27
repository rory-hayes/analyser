import { Client } from '@notionhq/client';
import { config } from '../config/config.js';

export async function fetchWorkspaceData(workspaceId) {
    const notion = new Client({
        auth: config.NOTION_API_KEY
    });

    try {
        // Your existing fetchWorkspaceData implementation
        const response = await notion.databases.query({
            database_id: workspaceId
        });

        return response;
    } catch (error) {
        console.error('Error fetching workspace data:', error);
        throw error;
    }
} 