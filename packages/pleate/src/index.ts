// pleate — root entry. Every module is also importable on its own (pleate/button, pleate/theme…) for the smallest
// bundles; this barrel re-exports them all and stays tree-shakable (sideEffects: false except CSS).
export * from "./lib/index.ts";
export * from "./theme/index.ts";
export * from "./motion/index.ts";

export * from "./components/avatar/index.ts";
export * from "./components/badge/index.ts";
export * from "./components/breadcrumb/index.ts";
export * from "./components/button/index.ts";
export * from "./components/card/index.ts";
export * from "./components/checkbox/index.ts";
export * from "./components/container/index.ts";
export * from "./components/context-menu/index.ts";
export * from "./components/divider/index.ts";
export * from "./components/dropdown/index.ts";
export * from "./components/footer/index.ts";
export * from "./components/grid/index.ts";
export * from "./components/icon-button/index.ts";
export * from "./components/input/index.ts";
export * from "./components/label/index.ts";
export * from "./components/menu/index.ts";
export * from "./components/navbar/index.ts";
export * from "./components/navigation-bar/index.ts";
export * from "./components/pagination/index.ts";
export * from "./components/radio/index.ts";
export * from "./components/section/index.ts";
export * from "./components/segmented-control/index.ts";
export * from "./components/select/index.ts";
export * from "./components/sidebar/index.ts";
export * from "./components/slider/index.ts";
export * from "./components/spinner/index.ts";
export * from "./components/stack/index.ts";
export * from "./components/switch/index.ts";
export * from "./components/tab-bar/index.ts";
export * from "./components/tabs/index.ts";
export * from "./components/tag/index.ts";
export * from "./components/textarea/index.ts";
