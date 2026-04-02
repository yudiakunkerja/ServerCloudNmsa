import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, groupsTable, groupMembersTable, groupMessagesTable, usersTable } from "@workspace/db";
import {
  ListGroupsQueryParams,
  ListGroupsResponse,
  CreateGroupBody,
  GetGroupParams,
  GetGroupResponse,
  UpdateGroupParams,
  UpdateGroupBody,
  UpdateGroupResponse,
  DeleteGroupParams,
  JoinGroupParams,
  JoinGroupBody,
  JoinGroupResponse,
  ListGroupMembersParams,
  ListGroupMembersResponse,
  ListGroupMessagesParams,
  ListGroupMessagesResponse,
  SendGroupMessageParams,
  SendGroupMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getGroupWithCount(groupId: number) {
  const [grp] = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId));
  if (!grp) return null;
  const [{ memberCount }] = await db
    .select({ memberCount: count() })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, groupId));
  return {
    ...grp,
    memberCount: Number(memberCount),
    createdAt: grp.createdAt.toISOString(),
  };
}

router.get("/groups", async (req, res): Promise<void> => {
  const params = ListGroupsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const members = await db
    .select({ groupId: groupMembersTable.groupId })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, params.data.userId));

  const groupIds = members.map((m) => m.groupId);

  if (groupIds.length === 0) {
    res.json([]);
    return;
  }

  const groups = await Promise.all(groupIds.map((gid) => getGroupWithCount(gid)));
  res.json(ListGroupsResponse.parse(groups.filter(Boolean)));
});

router.post("/groups", async (req, res): Promise<void> => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const inviteCode = generateInviteCode();
  const [group] = await db
    .insert(groupsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      inviteCode,
      ownerId: parsed.data.ownerId,
    })
    .returning();

  // Auto-add owner as member
  const user = await db.select().from(usersTable).where(eq(usersTable.uid, parsed.data.ownerId));
  const displayName = user[0]?.displayName ?? "Owner";

  await db.insert(groupMembersTable).values({
    groupId: group.id,
    userId: parsed.data.ownerId,
    displayName,
    role: "owner",
  });

  const result = await getGroupWithCount(group.id);
  res.status(201).json(result);
});

router.get("/groups/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetGroupParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await getGroupWithCount(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  res.json(GetGroupResponse.parse(result));
});

router.patch("/groups/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateGroupParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.update(groupsTable).set(parsed.data).where(eq(groupsTable.id, params.data.id));
  const result = await getGroupWithCount(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  res.json(UpdateGroupResponse.parse(result));
});

router.delete("/groups/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteGroupParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(groupMessagesTable).where(eq(groupMessagesTable.groupId, params.data.id));
  await db.delete(groupMembersTable).where(eq(groupMembersTable.groupId, params.data.id));
  await db.delete(groupsTable).where(eq(groupsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/groups/:id/join", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = JoinGroupParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = JoinGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(and(eq(groupsTable.id, params.data.id), eq(groupsTable.inviteCode, parsed.data.inviteCode)));

  if (!group) {
    res.status(404).json({ error: "Group not found or invalid invite code" });
    return;
  }

  const existing = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, group.id), eq(groupMembersTable.userId, parsed.data.userId)));

  if (existing.length === 0) {
    const user = await db.select().from(usersTable).where(eq(usersTable.uid, parsed.data.userId));
    const displayName = user[0]?.displayName ?? "Member";

    await db.insert(groupMembersTable).values({
      groupId: group.id,
      userId: parsed.data.userId,
      displayName,
      role: "member",
    });
  }

  const result = await getGroupWithCount(group.id);
  res.json(JoinGroupResponse.parse(result));
});

router.get("/groups/:id/members", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListGroupMembersParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const members = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, params.data.id))
    .orderBy(groupMembersTable.joinedAt);

  res.json(
    ListGroupMembersResponse.parse(
      members.map((m) => ({ ...m, joinedAt: m.joinedAt.toISOString() }))
    )
  );
});

router.get("/groups/:id/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListGroupMessagesParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(groupMessagesTable)
    .where(eq(groupMessagesTable.groupId, params.data.id))
    .orderBy(groupMessagesTable.createdAt);

  res.json(
    ListGroupMessagesResponse.parse(
      messages.map((m) => ({
        ...m,
        scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      }))
    )
  );
});

router.post("/groups/:id/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SendGroupMessageParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendGroupMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { scheduledAt, ...rest } = parsed.data;
  const [message] = await db
    .insert(groupMessagesTable)
    .values({
      groupId: params.data.id,
      ...rest,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      messageType: rest.messageType ?? "message",
    })
    .returning();

  res.status(201).json({
    ...message,
    scheduledAt: message.scheduledAt ? message.scheduledAt.toISOString() : null,
    createdAt: message.createdAt.toISOString(),
  });
});

export default router;
