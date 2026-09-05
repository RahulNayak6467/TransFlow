import { checkDatabaseHealth } from "@transflow/db";
import { type Request, type Response } from "express";

export const serverHealth = (req: Request, res: Response) => {
  res.setHeader('Cache-Control', "no-store");

  return res.status(200).json({
    status: "ok",
  });
};

type ReadinessResponse = {
  status: "ready" | "not_ready";
}

export const readinessHealth = async (req: Request, res: Response):Promise<Response<ReadinessResponse>> => {
  res.setHeader("Cache-Control", "no-store");

  const checkStatus = await checkDatabaseHealth();

  if (checkStatus) {
    return res.status(200).json({
      status: "ready",
    })
  }

  return res.status(503).json({
    status: "not_ready",
  })
}
