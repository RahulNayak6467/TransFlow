import { type Request, type Response } from "express";

export const serverHealth = (req: Request, res: Response) => {
  res.setHeader('Cache-Control', "no-store");

  return res.status(200).json({
    status: "ok",
  });
};
