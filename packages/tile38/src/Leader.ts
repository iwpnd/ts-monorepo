import { Follower } from './Follower';
import { FSetQuery, SetQuery } from './queries';
import { Command, Fields, JSONResponse } from './types';

export class Leader extends Follower {
    del(key: string, id: string): Promise<JSONResponse> {
        return this.command(Command.DEL, [key, id]);
    }

    pdel(key: string, pattern: string): Promise<JSONResponse> {
        return this.command(Command.PDEL, [key, pattern]);
    }

    drop(key: string): Promise<JSONResponse> {
        return this.command(Command.DROP, [key]);
    }

    expire(key: string, id: string, seconds: number): Promise<JSONResponse> {
        return this.command(Command.EXPIRE, [key, id, seconds]);
    }

    set(key: string, id: string): SetQuery {
        return new SetQuery(this, key, id);
    }

    fset(key: string, id: string, fields: Fields): FSetQuery {
        return new FSetQuery(this, key, id, fields);
    }

    flushDb(): Promise<JSONResponse> {
        return this.command(Command.FLUSHDB);
    }
}