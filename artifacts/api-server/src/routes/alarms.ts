import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, alarmsTable } from "@workspace/db";
import {
  ListAlarmsQueryParams,
  ListAlarmsResponse,
  CreateAlarmBody,
  UpdateAlarmParams,
  UpdateAlarmBody,
  UpdateAlarmResponse,
  DeleteAlarmParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapAlarm(a: typeof alarmsTable.$inferSelect) {
  return {
    ...a,
    scheduledAt: a.scheduledAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/alarms", async (req, res): Promise<void> => {
  const params = ListAlarmsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const alarms = await db
    .select()
    .from(alarmsTable)
    .where(eq(alarmsTable.userId, params.data.userId))
    .orderBy(alarmsTable.scheduledAt);

  res.json(ListAlarmsResponse.parse(alarms.map(mapAlarm)));
});

router.post("/alarms", async (req, res): Promise<void> => {
  const parsed = CreateAlarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [alarm] = await db
    .insert(alarmsTable)
    .values({
      ...parsed.data,
      scheduledAt: new Date(parsed.data.scheduledAt),
      repeatType: parsed.data.repeatType ?? "none",
      soundEnabled: parsed.data.soundEnabled ?? true,
    })
    .returning();

  res.status(201).json(mapAlarm(alarm));
});

router.patch("/alarms/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAlarmParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAlarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { scheduledAt, ...rest } = parsed.data;
  const [alarm] = await db
    .update(alarmsTable)
    .set({
      ...rest,
      ...(scheduledAt !== undefined ? { scheduledAt: new Date(scheduledAt) } : {}),
    })
    .where(eq(alarmsTable.id, params.data.id))
    .returning();

  if (!alarm) {
    res.status(404).json({ error: "Alarm not found" });
    return;
  }

  res.json(UpdateAlarmResponse.parse(mapAlarm(alarm)));
});

router.delete("/alarms/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAlarmParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(alarmsTable).where(eq(alarmsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Alarm not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
