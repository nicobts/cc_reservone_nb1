import { appRouter } from "@/server/api"
import { createContext } from "@/server/api/context"
import { NextRequest } from "next/server"

async function handler(request: NextRequest) {
  const context = await createContext(request.headers)

  const path = request.nextUrl.pathname.replace("/api/rpc/", "")
  const [routerName, procedureName] = path.split(".")

  if (!routerName || !procedureName) {
    return Response.json({ error: "Invalid procedure path" }, { status: 400 })
  }

  try {
    const router = appRouter[routerName as keyof typeof appRouter]
    if (!router) {
      return Response.json({ error: "Router not found" }, { status: 404 })
    }

    const procedure = router[procedureName as keyof typeof router]
    if (!procedure || typeof procedure !== "function") {
      return Response.json({ error: "Procedure not found" }, { status: 404 })
    }

    const body = await request.json()
    const result = await procedure({ input: body, context })

    return Response.json({ result })
  } catch (error) {
    console.error("RPC Error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export { handler as GET, handler as POST }
