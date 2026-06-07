declare module 'cube-solver' {
  /** 解一个被 scramble 序列打乱的魔方，返回解法记号串。type 如 'kociemba'。 */
  export function solve(scramble: string, type?: string): string;
  export function scramble(type?: string): string;
  export function initialize(type?: string): void;
}
