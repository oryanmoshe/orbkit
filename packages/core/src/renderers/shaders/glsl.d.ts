/** Allow importing .glsl files as raw strings */
declare module '*.glsl' {
  const source: string;
  export default source;
}
