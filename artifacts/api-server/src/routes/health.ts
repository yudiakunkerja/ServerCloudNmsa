import { Router, Request, Response } from "express";

const router = Router();

// Tambahkan : Request dan : Response pada parameter
router.get("/", (req: Request, res: Response) => {
  res.send({ status: "ok" });
});

export default router;
