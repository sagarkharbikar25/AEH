import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Run, RunSchema } from '@polaris/contracts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_DIR = path.resolve(__dirname, '../../.data/runs');

export interface IRunsRepository {
  saveRun(run: Run): Promise<void>;
  getRun(runId: string): Promise<Run | null>;
  listRuns(limit?: number): Promise<Run[]>;
}

export class FileRunsRepository implements IRunsRepository {
  private dataDir: string;
  private memoryCache: Map<string, Run> = new Map();

  constructor(dataDir: string = DEFAULT_DATA_DIR) {
    this.dataDir = dataDir;
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (err) {
      console.warn('[RunsRepository] Could not create disk data directory, using in-memory store:', err);
    }
  }

  async saveRun(run: Run): Promise<void> {
    RunSchema.parse(run);
    this.memoryCache.set(run.runId, run);

    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const filePath = path.join(this.dataDir, `${run.runId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(run, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`[RunsRepository] Failed to persist run ${run.runId} to disk:`, err);
    }
  }

  async getRun(runId: string): Promise<Run | null> {
    if (this.memoryCache.has(runId)) {
      return this.memoryCache.get(runId)!;
    }

    try {
      const filePath = path.join(this.dataDir, `${runId}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const run = RunSchema.parse(JSON.parse(raw));
        this.memoryCache.set(runId, run);
        return run;
      }
    } catch (err) {
      console.warn(`[RunsRepository] Failed to read run ${runId} from disk:`, err);
    }

    return null;
  }

  async listRuns(limit: number = 20): Promise<Run[]> {
    const runs: Run[] = Array.from(this.memoryCache.values());

    try {
      if (fs.existsSync(this.dataDir)) {
        const files = fs.readdirSync(this.dataDir).filter((f) => f.endsWith('.json'));
        for (const file of files) {
          const runId = path.basename(file, '.json');
          if (!this.memoryCache.has(runId)) {
            const raw = fs.readFileSync(path.join(this.dataDir, file), 'utf-8');
            try {
              const run = RunSchema.parse(JSON.parse(raw));
              runs.push(run);
              this.memoryCache.set(runId, run);
            } catch {
              // ignore corrupted file
            }
          }
        }
      }
    } catch {
      // fallback to memory
    }

    return runs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const runsRepository: IRunsRepository = new FileRunsRepository();
