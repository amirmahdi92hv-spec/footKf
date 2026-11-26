import { db } from "../src/db/client";
import { migrate } from "../src/db/migrate";
await migrate(db());
console.log("migrations applied");
