import dotenv from 'dotenv';
dotenv.config();

export interface DBConfig {
    connectionString: string | undefined;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
}

export const DBCONFIG: DBConfig = {
    connectionString: process.env.DATABASE_URL,
    // performance optimizations
    max: 20, // max number of clients in the pool
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
}