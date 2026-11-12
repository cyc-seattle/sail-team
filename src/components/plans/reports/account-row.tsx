import type { AccountAmount, LineAmount } from "@/model/reports";
import type { AccountTableRow } from "../account-table";
import { Money } from "../money";

// A budget line's explanation is only its own name again.
const explained = (line: LineAmount) => line.explanation !== null && line.explanation !== line.name;

const lineName = (line: LineAmount) => (line.offerings > 1 ? `${line.name}, ${line.offerings} offerings` : line.name);

/** What an account's one line says that its own row doesn't, such as how the engine worked it out. */
function onlyLineNote(account: AccountAmount, line: LineAmount) {
  const named = line.name !== account.name || line.offerings > 1 ? lineName(line) : null;
  const how = explained(line) ? line.explanation : null;
  return [named, how].filter(Boolean).join(": ") || null;
}

/**
 * An account as an Account Table row, which opens to its lines when it has two or more: each line's name, how many
 * offerings it's on, how the engine worked it out, and its amount. One line says what it adds behind an info icon.
 */
export function accountRow(account: AccountAmount): AccountTableRow {
  const lines = account.lines ?? [];
  return {
    key: `${account.number} ${account.name}`,
    number: account.number,
    name: account.name,
    note: lines.length === 1 ? onlyLineNote(account, lines[0]!) : null,
    values: [<Money key="amount" cents={account.cents} whole />],
    lines: lines.map((line) => ({
      key: `${line.name} ${line.explanation}`,
      name: lineName(line),
      detail: explained(line) ? line.explanation : null,
      values: [<Money key="amount" cents={line.cents} whole />],
    })),
  };
}
