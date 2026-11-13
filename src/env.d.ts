declare module '*.yaml' {
  const data: unknown;
  export default data;
}
declare module '*.md' {
  const doc: { slug: string; title: string; html: string; [key: string]: unknown };
  export default doc;
}
