import { Router } from "express";
import { serverHealth } from "./health.controllers.js";

const router: Router = Router();

router.get("/live", serverHealth)

export default router;
