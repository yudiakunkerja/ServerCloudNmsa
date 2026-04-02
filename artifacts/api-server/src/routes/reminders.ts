import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, remindersTable } from "@workspace/db";
import {
  ListRemindersQueryParams,
  ListRemindersResponse,
  CreateReminderBody,
  GetReminderParams,
  GetReminderResponse,
  UpdateReminderParams,
  UpdateReminderBody,
  UpdateReminderResponse,
  DeleteReminderParams,
  GetDashboardSummaryQueryParams,
  GetDashboardSummaryResponse,
} from "@workspace/api-zod";
import { alarmsTable, groupsTable, groupMembersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function mapReminder(r: typeof remindersTable.$inferSelect) {
  return {
    ...r,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/reminders", async (req, res): Promise<void> => {
  const params = ListRemindersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reminders = await db
    .select()
    .from(remindersTable)
    .where(eq(remindersTable.userId, params.data.userId))
    .orderBy(remindersTable.createdAt);

  res.json(ListRemindersResponse.parse(reminders.map(mapReminder)));
});

router.post("/reminders", async (req, res): Promise<void> => {
  const parsed = CreateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { scheduledAt, ...rest } = parsed.data;
  const [reminder] = await db
    .insert(remindersTable)
    .values({
      ...rest,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      type: rest.type ?? "reminder",
      priority: rest.priority ?? "medium",
    })
    .returning();

  res.status(201).json(GetReminderResponse.parse(mapReminder(reminder)));
});

router.get("/reminders/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetReminderParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reminder] = await db.select().from(remindersTable).where(eq(remindersTable.id, params.data.id));
  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }

  res.json(GetReminderResponse.parse(mapReminder(reminder)));
});

router.patch("/reminders/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateReminderParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { scheduledAt, ...rest } = parsed.data;
  const [reminder] = await db
    .update(remindersTable)
    .set({
      ...rest,
      ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
    })
    .where(eq(remindersTable.id, params.data.id))
    .returning();

  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }

  res.json(UpdateReminderResponse.parse(mapReminder(reminder)));
});

router.delete("/reminders/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteReminderParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(remindersTable).where(eq(remindersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const params = GetDashboardSummaryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId } = params.data;

  const [reminderStats] = await db
    .select({
      total: count(),
      completed: sql<number>`sum(case when ${remindersTable.isCompleted} then 1 else 0 end)`,
    })
    .from(remindersTable)
    .where(eq(remindersTable.userId, userId));

  const [alarmStats] = await db
    .select({
      total: count(),
      active: sql<number>`sum(case when ${alarmsTable.isActive} then 1 else 0 end)`,
    })
    .from(alarmsTable)
    .where(eq(alarmsTable.userId, userId));

  const groupsResult = await db
    .select({ groupId: groupMembersTable.groupId })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, userId));

  const now = new Date();
  const upcoming = await db
    .select({ id: remindersTable.id })
    .from(remindersTable)
    .where(and(eq(remindersTable.userId, userId), eq(remindersTable.isCompleted, false)));

  const totalReminders = Number(reminderStats?.total ?? 0);
  const completed = Number(reminderStats?.completed ?? 0);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalReminders,
      pendingReminders: totalReminders - completed,
      completedReminders: completed,
      totalAlarms: Number(alarmStats?.total ?? 0),
      activeAlarms: Number(alarmStats?.active ?? 0),
      totalGroups: groupsResult.length,
      upcomingCount: upcoming.length,
    })
  );
});

export default router;
