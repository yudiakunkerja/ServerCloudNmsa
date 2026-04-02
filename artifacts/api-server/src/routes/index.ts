import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import remindersRouter from "./reminders";
import alarmsRouter from "./alarms";
import groupsRouter from "./groups";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(remindersRouter);
router.use(alarmsRouter);
router.use(groupsRouter);
router.use(notificationsRouter);

export default router;
