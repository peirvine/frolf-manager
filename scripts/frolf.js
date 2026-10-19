// `npm run frolf`: starts the Firebase emulators and the dev server together.
// Ctrl+C stops both; the emulators get time to export their data (--export-on-exit) before this exits.
const { spawn } = require("child_process")

const run = (name, command) => {
  const child = spawn(command, { shell: true, stdio: "inherit" })
  child.on("exit", (code) => onExit(name, code))
  return child
}

const children = {}
let stopping = false

const stop = () => {
  if (stopping) return
  stopping = true
  Object.values(children).forEach((child) => child.kill("SIGINT"))
}

const onExit = (name, code) => {
  delete children[name]
  if (!stopping) console.log(`[frolf] ${name} exited (${code}); stopping the rest`)
  stop()
  if (Object.keys(children).length === 0) process.exit(code || 0)
}

process.on("SIGINT", stop)
process.on("SIGTERM", stop)

children.emulators = run("emulators", "npm run emulators")
children.app = run("app", "npm run start")
