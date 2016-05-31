Error.stackTraceLimit = Infinity;

const debug = require("debug");
debug.enable("log:*");
if (process.env.ABL_DEBUG === "true") {
	debug.enable("test:*");
}

const q = require("q");
q.longStackSupport = true;

process.on("uncaughtException", (exception) => {
	debug("log:mocha")(exception);
});
