import net from 'net';
import mongoose from 'mongoose';
import mingo from 'mingo';
import { Pool } from 'pg';

const { BSON, ObjectId, Long } = mongoose.mongo;

const NEON_DB_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_1etfTpdj9MIs@ep-solitary-grass-aw63o3pp-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';

interface WireState {
  server: net.Server | null;
  port: number | null;
  collections: Map<string, any[]>;
  loadedFromPg: boolean;
  pgPool: Pool | null;
}

const gState: WireState = (global as any).__gdcWireState || {
  server: null,
  port: null,
  collections: new Map<string, any[]>(),
  loadedFromPg: false,
  pgPool: null,
};
(global as any).__gdcWireState = gState;

function getPool(): Pool | null {
  if (!NEON_DB_URL) return null;
  if (!gState.pgPool) {
    gState.pgPool = new Pool({
      connectionString: NEON_DB_URL,
      max: 4,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return gState.pgPool;
}

export async function loadCollectionsFromNeon(force = false) {
  if (gState.loadedFromPg && !force) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gdc_mongo_collections (
        collection_name TEXT PRIMARY KEY,
        docs_json TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const res = await pool.query(`SELECT collection_name, docs_json FROM gdc_mongo_collections`);
    for (const row of res.rows) {
      try {
        const docs = BSON.EJSON.parse(row.docs_json);
        if (Array.isArray(docs)) {
          gState.collections.set(row.collection_name, docs);
        }
      } catch (e) {
        console.warn('[PureJsMongo] Parse error for', row.collection_name, e);
      }
    }
    gState.loadedFromPg = true;
  } catch (err) {
    console.warn('[PureJsMongo] Load from Neon warning:', err);
  }
}

export async function saveCollectionToNeon(colName: string) {
  const pool = getPool();
  if (!pool) return;
  try {
    const docs = gState.collections.get(colName) || [];
    const serialized = BSON.EJSON.stringify(docs);
    await pool.query(
      `INSERT INTO gdc_mongo_collections (collection_name, docs_json, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (collection_name) DO UPDATE SET docs_json = EXCLUDED.docs_json, updated_at = NOW();`,
      [colName, serialized]
    );
  } catch (err) {
    console.warn('[PureJsMongo] Save to Neon warning:', err);
  }
}

function getCol(name: string): any[] {
  if (!gState.collections.has(name)) {
    gState.collections.set(name, []);
  }
  return gState.collections.get(name)!;
}

function normalizeForMatch(val: any): any {
  if (val === null || val === undefined) return val;
  if (val instanceof ObjectId || val?._bsontype === 'ObjectId') {
    return val.toString();
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (Array.isArray(val)) {
    return val.map(normalizeForMatch);
  }
  if (typeof val === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = normalizeForMatch(v);
    }
    return out;
  }
  return val;
}

function matchesFilter(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  const normDoc = normalizeForMatch(doc);
  const normFilter = normalizeForMatch(filter);
  const q = new mingo.Query(normFilter);
  return q.test(normDoc);
}

function applyUpdate(doc: any, update: any) {
  if (!update) return;
  const now = new Date();
  const hasOperators = Object.keys(update).some((k) => k.startsWith('$'));
  if (!hasOperators) {
    const id = doc._id;
    const createdAt = doc.createdAt || now;
    for (const k of Object.keys(doc)) {
      if (k !== '_id') delete doc[k];
    }
    Object.assign(doc, update, { _id: id, createdAt, updatedAt: now });
    return;
  }

  if (update.$setOnInsert) {
    for (const [k, v] of Object.entries(update.$setOnInsert)) {
      if (doc[k] === undefined) doc[k] = v;
    }
  }
  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      doc[k] = v;
    }
  }
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      doc[k] = (Number(doc[k]) || 0) + Number(v);
    }
  }
  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) {
      delete doc[k];
    }
  }
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(doc[k])) doc[k] = [];
      doc[k].push(v);
    }
  }
  if (!doc.createdAt) doc.createdAt = now;
  doc.updatedAt = now;
}

async function handleCommand(cmd: any): Promise<any> {
  const dbName = cmd.$db || 'gigantes-do-corte';

  if (cmd.ismaster || cmd.isMaster || cmd.hello) {
    return {
      ismaster: true,
      isWritablePrimary: true,
      maxBsonObjectSize: 16777216,
      maxMessageSizeBytes: 48000000,
      maxWriteBatchSize: 100000,
      localTime: new Date(),
      minWireVersion: 0,
      maxWireVersion: 17,
      ok: 1,
    };
  }

  if (cmd.ping || cmd.buildInfo || cmd.buildinfo || cmd.createIndexes || cmd.create || cmd.endSessions) {
    return { ok: 1 };
  }

  if (cmd.find) {
    const colName = cmd.find;
    const docs = getCol(colName);
    const filter = cmd.filter || {};
    let matched = docs.filter((d) => matchesFilter(d, filter));

    if (cmd.sort) {
      const sortEntries = Object.entries(cmd.sort);
      matched.sort((a, b) => {
        for (const [field, dir] of sortEntries) {
          const av = a[field];
          const bv = b[field];
          if (av < bv) return (dir as number) < 0 ? 1 : -1;
          if (av > bv) return (dir as number) < 0 ? -1 : 1;
        }
        return 0;
      });
    }

    if (cmd.skip) {
      matched = matched.slice(Number(cmd.skip));
    }
    if (cmd.limit) {
      matched = matched.slice(0, Number(cmd.limit));
    }

    return {
      cursor: {
        id: Long.fromNumber(0),
        ns: `${dbName}.${colName}`,
        firstBatch: matched,
      },
      ok: 1,
    };
  }

  if (cmd.count || cmd.countDocuments) {
    const colName = cmd.count || cmd.countDocuments;
    const docs = getCol(colName);
    const filter = cmd.query || cmd.filter || {};
    const matched = docs.filter((d) => matchesFilter(d, filter));
    return { n: matched.length, ok: 1 };
  }

  if (cmd.aggregate) {
    const colName = cmd.aggregate;
    const docs = getCol(colName);
    const pipeline = cmd.pipeline || [];
    let current = [...docs];
    for (const stage of pipeline) {
      if (stage.$match) {
        current = current.filter((d) => matchesFilter(d, stage.$match));
      } else if (stage.$count) {
        current = [{ [stage.$count]: current.length }];
      } else if (stage.$group && stage.$group._id === null && stage.$group.n) {
        current = [{ _id: null, n: current.length }];
      }
    }
    return {
      cursor: {
        id: Long.fromNumber(0),
        ns: `${dbName}.${colName}`,
        firstBatch: current,
      },
      ok: 1,
    };
  }

  if (cmd.insert) {
    const colName = cmd.insert;
    const col = getCol(colName);
    const toInsert = cmd.documents || [];
    const now = new Date();
    let count = 0;
    for (const doc of toInsert) {
      if (!doc._id) doc._id = new ObjectId();
      if (!doc.createdAt) doc.createdAt = now;
      if (!doc.updatedAt) doc.updatedAt = now;
      const idx = col.findIndex((existing) => String(existing._id) === String(doc._id));
      if (idx >= 0) {
        col[idx] = doc;
      } else {
        col.push(doc);
      }
      count++;
    }
    await saveCollectionToNeon(colName);
    return { n: count, ok: 1 };
  }

  if (cmd.update) {
    const colName = cmd.update;
    const col = getCol(colName);
    const updates = cmd.updates || [];
    let matchedCount = 0;
    let modifiedCount = 0;
    const upserted: any[] = [];

    for (let i = 0; i < updates.length; i++) {
      const u = updates[i];
      const q = u.q || {};
      const uDoc = u.u || {};
      const multi = Boolean(u.multi);
      const upsert = Boolean(u.upsert);

      const matches = col.filter((d) => matchesFilter(d, q));
      if (matches.length === 0 && upsert) {
        const newDoc: any = { _id: q._id || new ObjectId() };
        for (const [k, v] of Object.entries(q)) {
          if (!k.startsWith('$')) newDoc[k] = v;
        }
        applyUpdate(newDoc, uDoc);
        col.push(newDoc);
        upserted.push({ index: i, _id: newDoc._id });
      } else {
        const targets = multi ? matches : matches.slice(0, 1);
        for (const target of targets) {
          matchedCount++;
          applyUpdate(target, uDoc);
          modifiedCount++;
        }
      }
    }
    await saveCollectionToNeon(colName);
    return { n: matchedCount + upserted.length, nModified: modifiedCount, upserted, ok: 1 };
  }

  if (cmd.findAndModify || cmd.findandmodify) {
    const colName = cmd.findAndModify || cmd.findandmodify;
    const col = getCol(colName);
    const query = cmd.query || {};
    const idx = col.findIndex((d) => matchesFilter(d, query));

    if (idx === -1) {
      if (cmd.upsert && cmd.update) {
        const newDoc: any = { _id: query._id || new ObjectId() };
        for (const [k, v] of Object.entries(query)) {
          if (!k.startsWith('$')) newDoc[k] = v;
        }
        applyUpdate(newDoc, cmd.update);
        col.push(newDoc);
        await saveCollectionToNeon(colName);
        return { lastErrorObject: { n: 1, updatedExisting: false, upserted: newDoc._id }, value: cmd.new ? newDoc : null, ok: 1 };
      }
      return { lastErrorObject: { n: 0, updatedExisting: false }, value: null, ok: 1 };
    }

    const doc = col[idx];
    const beforeClone = BSON.deserialize(BSON.serialize(doc));

    if (cmd.remove) {
      col.splice(idx, 1);
      await saveCollectionToNeon(colName);
      return { lastErrorObject: { n: 1 }, value: beforeClone, ok: 1 };
    }

    if (cmd.update) {
      applyUpdate(doc, cmd.update);
      await saveCollectionToNeon(colName);
    }

    return {
      lastErrorObject: { n: 1, updatedExisting: true },
      value: cmd.new ? doc : beforeClone,
      ok: 1,
    };
  }

  if (cmd.delete) {
    const colName = cmd.delete;
    const col = getCol(colName);
    const deletes = cmd.deletes || [];
    let removed = 0;

    for (const del of deletes) {
      const q = del.q || {};
      const limit = del.limit || 0;
      for (let i = col.length - 1; i >= 0; i--) {
        if (matchesFilter(col[i], q)) {
          col.splice(i, 1);
          removed++;
          if (limit === 1) break;
        }
      }
    }
    await saveCollectionToNeon(colName);
    return { n: removed, ok: 1 };
  }

  return { ok: 1 };
}

export async function startPureJsMongoWireServer(): Promise<string> {
  await loadCollectionsFromNeon();

  if (gState.server && gState.port) {
    return `mongodb://127.0.0.1:${gState.port}/gigantes-do-corte`;
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      let buf = Buffer.alloc(0);

      socket.on('data', async (chunk) => {
        buf = Buffer.concat([buf, chunk]);

        while (buf.length >= 4) {
          const msgLen = buf.readInt32LE(0);
          if (buf.length < msgLen) break;

          const msg = buf.subarray(0, msgLen);
          buf = buf.subarray(msgLen);

          const reqId = msg.readInt32LE(4);
          const opCode = msg.readInt32LE(12);

          try {
            if (opCode === 2004) {
              // OP_QUERY
              let offset = 20;
              while (offset < msg.length && msg[offset] !== 0) offset++;
              offset += 9;
              const cmd = BSON.deserialize(msg.subarray(offset));
              const reply = await handleCommand(cmd);
              const replyBson = BSON.serialize(reply);
              const header = Buffer.alloc(36);
              header.writeInt32LE(36 + replyBson.length, 0);
              header.writeInt32LE(1, 4);
              header.writeInt32LE(reqId, 8);
              header.writeInt32LE(1, 12);
              header.writeInt32LE(1, 32);
              socket.write(Buffer.concat([header, replyBson]));
            } else if (opCode === 2013) {
              // OP_MSG
              let pos = 20;
              let cmd: any = {};
              while (pos < msg.length) {
                const kind = msg[pos++];
                if (kind === 0) {
                  const sz = msg.readInt32LE(pos);
                  cmd = { ...cmd, ...BSON.deserialize(msg.subarray(pos, pos + sz)) };
                  pos += sz;
                } else if (kind === 1) {
                  const sz = msg.readInt32LE(pos);
                  const end = pos + sz;
                  pos += 4;
                  let id = '';
                  while (pos < end && msg[pos] !== 0) {
                    id += String.fromCharCode(msg[pos++]);
                  }
                  pos++;
                  const arr: any[] = [];
                  while (pos < end) {
                    const dsz = msg.readInt32LE(pos);
                    arr.push(BSON.deserialize(msg.subarray(pos, pos + dsz)));
                    pos += dsz;
                  }
                  cmd[id] = arr;
                } else {
                  break;
                }
              }

              const reply = await handleCommand(cmd);
              const replyBson = BSON.serialize(reply);
              const header = Buffer.alloc(21);
              header.writeInt32LE(21 + replyBson.length, 0);
              header.writeInt32LE(1, 4);
              header.writeInt32LE(reqId, 8);
              header.writeInt32LE(2013, 12);
              header.writeUInt32LE(0, 16);
              header.writeUInt8(0, 20);
              socket.write(Buffer.concat([header, replyBson]));
            }
          } catch (err: any) {
            const errReply = BSON.serialize({ ok: 0, errmsg: err?.message || 'Wire error' });
            const header = Buffer.alloc(21);
            header.writeInt32LE(21 + errReply.length, 0);
            header.writeInt32LE(1, 4);
            header.writeInt32LE(reqId, 8);
            header.writeInt32LE(2013, 12);
            socket.write(Buffer.concat([header, errReply]));
          }
        }
      });

      socket.on('error', () => {});
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo;
      gState.server = server;
      gState.port = addr.port;
      resolve(`mongodb://127.0.0.1:${addr.port}/gigantes-do-corte`);
    });
  });
}
