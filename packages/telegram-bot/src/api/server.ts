import express, { type Express } from "express"
import type { Server } from "http"
import cors from "cors"
import { linkTokenRoute } from "./routes/link-token.js"
import { linkRoute } from "./routes/link.js"

export async function startApiServer(port: number): Promise<Server> {
  const app: Express = express()

  // Middleware
  app.use(cors())
  app.use(express.json())

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" })
  })

  // Register routes
  app.use("/api/link", linkTokenRoute)
  app.use("/api/link", linkRoute)

  // Start server
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      resolve(server)
    })

    server.on("error", reject)
  })
}
