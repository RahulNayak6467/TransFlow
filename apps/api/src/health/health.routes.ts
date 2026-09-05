import { Router } from "express";
import { readinessHealth, serverHealth } from "./health.controllers.js";

const router: Router = Router();

router.get("/live", serverHealth);
router.get("/ready", readinessHealth);

export default router;
