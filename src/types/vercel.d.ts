// src/types/vercel.d.ts
declare module '@vercel/node' {
  import { IncomingMessage, ServerResponse } from "http";

  export interface VercelRequest extends IncomingMessage {
    query: { [key: string]: string | string[] };
    cookies: { [key: string]: string };
    body: any;
  }

  export type VercelResponse = ServerResponse & {
    status: (statusCode: number) => VercelResponse;
    json: (body: any) => void;
  };
}
