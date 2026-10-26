// Commit messages must follow Conventional Commits, because the app's version is worked out from them (see writeVersion.js):
//   type(optional scope)!: description
// feat bumps the minor version, a "!" or a BREAKING CHANGE footer bumps the major version, anything else is a patch.
const fs = require('fs')

const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
const HEADER = new RegExp(`^(${TYPES.join('|')})(\\([\\w./-]+\\))?!?: \\S.*$`)
const MAX_LENGTH = 100

const message = fs.readFileSync(process.argv[2], 'utf8')
const header = message.split('\n').find(line => line.trim() && !line.startsWith('#')) || ''

// Messages git writes itself
if (/^(Merge |Revert "|fixup! |squash! |amend! )/.test(header)) process.exit(0)

if (!HEADER.test(header) || header.length > MAX_LENGTH) {
  console.error(`
Invalid commit message: "${header}"

Use:  type(optional scope): description      (first line at most ${MAX_LENGTH} characters)
Types: ${TYPES.join(', ')}
  feat: ...   a new feature         -> minor version bump
  fix: ...    a bug fix             -> patch bump
  feat!: ...  a breaking change     -> major version bump (or add a "BREAKING CHANGE:" footer)
Example: feat(rounds): add scheduled rounds
`)
  process.exit(1)
}
