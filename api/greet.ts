import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const name = req.query.name || "Guest";
  res.status(200).json({ message: `Hello, ${name}!` });
}
