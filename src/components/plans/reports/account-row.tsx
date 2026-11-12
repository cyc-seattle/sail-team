import type { AccountAmount, LineAmount } from "@/model/reports";
import type { AccountTableRow } from "../account-table";
import { Money } from "../money";

// A budget line's explanation is only its own name again.
const explained = (line: LineAmount) => line.explanation !== null && line.explanation !== line.name;

const lineName = (line: LineAmount) => (line.offerings > 1 ? `${line.name}, ${line.offerings} offerings` : line.name);

// Budget lines are often named after their account, give or take case, punctuation and a plural.
const loosely = (name: string) =>
  name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.replace(/s$/, ""))
    .join(" ");

/** Whether an account's one line is only the account again: the same name, on one offering, worked out no other way. */
const onlyItself = (account: AccountAmount, lines: LineAmount[]) =>
  lines.length === 1 &&
  lines[0]!.offerings <= 1 &&
  !explained(lines[0]!) &&
  loosely(lines[0]!.name) === loosely(account.name);

/**
 * An account as an Account Table row, which opens to its lines: each line's name, how many offerings it's on, how the
 * engine worked it out, and its amount. It doesn't open when its one line would only repeat it.
 */
export function accountRow(account: AccountAmount): AccountTableRow {
  const lines = account.lines ?? [];
  return {
    key: `${account.number} ${account.name}`,
    number: account.number,
    name: account.name,
    values: [<Money key="amount" cents={account.cents} whole />],
    lines: onlyItself(account, lines)
      ? []
      : lines.map((line) => ({
          key: `${line.name} ${line.explanation}`,
          name: lineName(line),
          detail: explained(line) ? line.explanation : null,
          values: [<Money key="amount" cents={line.cents} whole />],
        })),
  };
}
