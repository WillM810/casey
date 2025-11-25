export function parseArgs(argv = process.argv.slice(2)) {
    const args = { _: [] };
    let lastFlag = null;

    for (const arg of argv) {
        if (arg.startsWith("--")) {
            const [key, val] = arg.slice(2).split("=");
            args[key] = val !== undefined ? val : true;
            lastFlag = val === undefined ? key : null;
        } else if (arg.startsWith("-") && arg.length > 1) {
            arg.slice(1).split("").forEach(f => args[f] = true);
            lastFlag = arg.slice(-1);
        } else if (lastFlag) {
            args[lastFlag] = arg;
            lastFlag = null;
        } else {
            args._.push(arg);
        }
    }

    return args;
}
