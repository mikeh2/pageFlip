declare namespace _default {
    let input: string;
    namespace output {
        let file: string;
        let format: string;
    }
    let external: string[];
    let plugins: import("rollup").Plugin<any>[];
}
export default _default;
