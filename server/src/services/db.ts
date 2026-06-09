import pg from 'pg';
import { DBCONFIG } from '../config/db.js';

const pool = new pg.Pool(DBCONFIG);

pool.on('error', (err: Error) => {
    console.error('Unexpected database error on idle pool cleint:', err);
});


export const db = {
    query: <T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> => {
        return pool.query<T>(text, params);
    },

    getClient: (): Promise<pg.PoolClient> => {
        return pool.connect();
    },

    close: (): Promise<void> => {
        return pool.end();
    }
};