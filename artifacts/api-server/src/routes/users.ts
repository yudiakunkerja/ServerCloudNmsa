import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterUserBody,
  RegisterUserResponse,
  GetUserParams,
  GetUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/users/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { uid, displayName, email, photoUrl } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.uid, uid));

  if (existing.length > 0) {
    const [updated] = await db
      .update(usersTable)
      .set({ displayName, email, photoUrl: photoUrl ?? null })
      .where(eq(usersTable.uid, uid))
      .returning();
    res.json(RegisterUserResponse.parse({ ...updated, photoUrl: updated.photoUrl ?? null, createdAt: updated.createdAt.toISOString() }));
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ uid, displayName, email, photoUrl: photoUrl ?? null })
    .returning();

  res.json(RegisterUserResponse.parse({ ...user, photoUrl: user.photoUrl ?? null, createdAt: user.createdAt.toISOString() }));
});

router.get("/users/:uid", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.uid) ? req.params.uid[0] : req.params.uid;
  const params = GetUserParams.safeParse({ uid: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.uid, params.data.uid));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse({ ...user, photoUrl: user.photoUrl ?? null, createdAt: user.createdAt.toISOString() }));
});

export default router;
