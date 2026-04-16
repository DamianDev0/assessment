type EventHandler<T> = (payload: T) => void
type AnyHandler = EventHandler<never>

interface TypedEventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void
  emit<K extends keyof Events>(event: K, payload: Events[K]): void
}

export function createTypedEventEmitter<
  Events extends Record<string, unknown>
>(): TypedEventEmitter<Events> {
  const listeners = new Map<keyof Events, Set<AnyHandler>>()

  function getOrCreate(event: keyof Events): Set<AnyHandler> {
    const existing = listeners.get(event)
    if (existing) return existing
    const created = new Set<AnyHandler>()
    listeners.set(event, created)
    return created
  }

  return {
    on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
      getOrCreate(event).add(handler as AnyHandler)
    },

    off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
      listeners.get(event)?.delete(handler as AnyHandler)
    },

    emit<K extends keyof Events>(event: K, payload: Events[K]): void {
      listeners.get(event)?.forEach((h) => (h as EventHandler<Events[K]>)(payload))
    },
  }
}
