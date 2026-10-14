import type { QuoteLength } from "@/types/test";

export const CODE_SNIPPETS: Record<QuoteLength, string[]> = {
  medium: [
    "function add(a, b) {\n  return a + b;\n}",
    "const isEven = (n: number): boolean => n % 2 === 0;",
    "const names = users.map((user) => user.name);",
    "function greet(name: string) {\n  return `Hello, ${name}!`;\n}",
  ],
  long: [
    "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}",
    "type User = { id: number; name: string };\n\nfunction findUser(users: User[], id: number) {\n  return users.find((user) => user.id === id);\n}",
    "const total = items\n  .filter((item) => item.inStock)\n  .reduce((sum, item) => sum + item.price, 0);",
    "function debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}",
  ],
};
