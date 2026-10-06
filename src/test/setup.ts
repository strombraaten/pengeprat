// Enkel localStorage i minnet, slik at lagringsmodulene kan testes i Node.
import { beforeEach } from "vitest"

class MinneLagring implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v))
  }
}

globalThis.localStorage = new MinneLagring()

beforeEach(() => {
  localStorage.clear()
})
