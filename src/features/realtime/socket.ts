import type { Socket } from "socket.io-client"

// O socket.io-client é importado sob demanda: ele captura o WebSocket global
// ao ser carregado, e o MSW precisa já ter substituído esse construtor.
export async function connectSocket(): Promise<Socket> {
  const { io } = await import("socket.io-client")
  return io(window.location.origin, {
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  })
}
