// Reads a pasted UDisc "Export to CSV". Pastes don't reliably keep the line breaks between rows: they arrive as
// newlines, spaces or nothing at all ("...,Hole18 Par,..." or "...,3,4Bob,..."). So rows are found by counting fields
// instead: every row is PlayerName,CourseName,LayoutName,StartDate,EndDate,Total,+/-,RoundRating plus one per hole.
const FIXED_COLUMNS = 8

// Splits on commas and line breaks. A field that starts with a quote runs to its closing quote, so quoted names may
// hold commas; a quote anywhere else is kept as written (UDisc leaves layouts like Shorts 18 + 1 "B" unquoted).
const splitFields = (text) => {
  const fields = []
  let field = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c !== '"') field += c
      else if (text[i + 1] === '"') field += text[++i]
      else quoted = false
    } else if (c === '"' && field === "") {
      quoted = true
    } else if (c === "," || c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      fields.push(field)
      field = ""
    } else {
      field += c
    }
  }
  fields.push(field)
  return fields
}

// Returns the hole column names and the fields after the header, or null if the text doesn't start with UDisc's
// header. The Par row always comes first, so the last hole name may have "Par" stuck to it ("Hole18 Par", "Hole19Par").
const readHeader = (text) => {
  const fields = splitFields(String(text).trim())
  if (fields[0] !== "PlayerName") return null
  const holeNames = []
  let i = FIXED_COLUMNS
  while (i < fields.length && /^Hole/i.test(fields[i])) {
    const withPar = fields[i].match(/^(Hole.*?)\s*(Par)$/i)
    if (withPar) {
      holeNames.push(withPar[1])
      return { holeNames, rest: [withPar[2], ...fields.slice(i + 1)] }
    }
    holeNames.push(fields[i++])
  }
  return holeNames.length > 0 ? { holeNames, rest: fields.slice(i) } : null
}

// A row's last field may also hold the start of the next row's name ("3 Bob", "3Bob", "10alice"). The row's total
// says what the last hole must be, which also settles names that start with a digit ("32Fast" is a 3 and "2Fast").
const splitLastHole = (row) => {
  const field = row[row.length - 1]
  const holes = row.slice(FIXED_COLUMNS, -1).map(Number)
  const lastHole = String(Number(row[5]) - holes.reduce((sum, hole) => sum + hole, 0))
  if (/^\d+$/.test(lastHole) && field.startsWith(lastHole)) return [lastHole, field.slice(lastHole.length).trimStart()]
  const [, digits, name] = field.match(/^(\d*)\s*([\s\S]*)$/)
  return [digits, name]
}

// Several exports of the same round (each player group exports its own card) as one: the first export's rows with
// every later export's players added after them, leaving out their Par rows. Returns { rows } or { error } when the
// exports aren't the same course, layout and number of holes, or a player is on more than one.
export const combineUDiscCards = (texts) => {
  const parsed = texts.map(parseUDiscCsv)
  if (parsed.some(rows => !rows)) return { error: "Error, card input not valid. Paste the full UDisc CSV export, starting with PlayerName." }
  const [first, ...others] = parsed
  const rows = [...first]
  for (const next of others) {
    if (next[0].course !== first[0].course || next[0].layout !== first[0].layout || next[0].holes.length !== first[0].holes.length) {
      return { error: "Error, the cards in this round are for different courses, layouts or numbers of holes." }
    }
    rows.push(...next.slice(1))
  }
  if (others.length === 0) return { rows }
  const names = rows.slice(1).map(({ player }) => player)
  const duplicate = names.find((name, i) => names.indexOf(name) !== i)
  if (duplicate) return { error: `Error, ${duplicate} is on more than one card in this round.` }
  return { rows }
}

// Hole names as written in the header ("Hole1", "Hole 3A"), or [] if the text isn't a UDisc export
export const getUDiscHoleNames = (text) => readHeader(text)?.holeNames || []

// The rows of a UDisc export, Par first, as { player, course, layout, startDate, endDate, total, plusMinus, rating,
// holes } with every value a string. Returns null if the text isn't a UDisc export or a row is cut short.
export const parseUDiscCsv = (text) => {
  const header = readHeader(text)
  if (!header || header.rest[0] !== "Par") return null
  const rowLength = FIXED_COLUMNS + header.holeNames.length
  const fields = [...header.rest]
  const rows = []
  while (fields.length > 0) {
    const row = fields.splice(0, rowLength)
    if (row.length < rowLength) {
      if (row.every(field => field.trim() === "")) break
      return null
    }
    const [lastHole, nextName] = splitLastHole(row)
    row[rowLength - 1] = lastHole
    if (nextName) fields.unshift(nextName)
    const [player, course, layout, startDate, endDate, total, plusMinus, rating] = row
    rows.push({ player, course, layout, startDate, endDate, total, plusMinus, rating, holes: row.slice(FIXED_COLUMNS) })
  }
  return rows
}
