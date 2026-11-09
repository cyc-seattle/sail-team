Feature: Seeing the Financial Plans
  A Financial Plan is the organization's plan for one year. It holds one Operations Plan and a Program Plan for any
  of the organization's program areas, and the P&L they make together. Planners work on it as a whole, through their
  AI: it starts as a draft, and when it's ready a planner saves it. A saved Financial Plan and its plans never
  change. To change the plan after that, a planner starts a new Financial Plan from an earlier one, its parent, and
  the new one begins as a copy of it. A year can have several drafts at once, so planners can weigh options side by
  side, such as two drafts started from the same Financial Plan, one with two coaches and one with three. Each
  Financial Plan has a name, and a note that says what it was for, such as "Reviewed with the board".

  Plans is where planners, and anyone else who can read plans, see the Financial Plans and what each plan in them
  takes in and spends. A Program Plan's P&L includes its coaches' wages, its RIBs, and its share of the shared
  costs, such as the office, worked out with the other plans in the same Financial Plan. A planner who can change
  plans can rename a draft, change any Financial Plan's note, save a draft, mark a saved one active, and start a new
  draft from one here. Everything else
  about a plan is changed through their AI. Every plan and number here is made up for the run.

  Rule: Plans lists each year's Financial Plans, newest first, with their names and notes

    Scenario: Two saved Financial Plans for a year
      Given I'm a planner who can read plans
      And a saved Financial Plan for 2027 named "Budget", noted "Reviewed with the board"
      And a later one started from it named "Adopted budget", noted "Adopted by the board"
      And I've signed in
      When I open Plans
      Then under 2027 I see "Adopted budget", then "Budget"
      And each shows its note, the day it was saved, and the one it was started from

    Scenario: Each saved Financial Plan shows its revenue, expenses, gross, and net
      Given I'm a planner who can read plans
      And a saved Financial Plan for 2027 whose camp takes in $10,000 and spends $5,000 running it
      And I've signed in
      When I open Plans
      Then the Financial Plan shows revenue of $10,000, expenses of $5,000, gross of $5,000, and net of $5,000

    Scenario: A year's drafts are listed with its saved Financial Plans
      Given I'm a planner who can read plans
      And a saved Financial Plan for 2027 named "Budget"
      And two drafts started from it, named "Two coaches" and "Three coaches"
      And I've signed in
      When I open Plans
      Then under 2027 I see "Two coaches" and "Three coaches", each marked as a draft, and "Budget"

  Rule: Two Financial Plans started from the same one can be compared side by side

    Scenario: Comparing two options
      Given I'm a planner who can read plans
      And two drafts started from the same Financial Plan: "Two coaches", with an operating net of $4,000, and "Three coaches", with an operating net of $2,000
      And I've signed in
      When I compare "Two coaches" with "Three coaches"
      Then I see each one's operating net side by side, $4,000 and $2,000
      And I see that "Two coaches" nets $2,000 more

  Rule: A Financial Plan shows a summary of each program area and Non-program, then each program's offerings

    Scenario: A Financial Plan with an Operations Plan and two Program Plans
      Given I'm a planner who can read plans
      And a saved Financial Plan with an Operations Plan, and Program Plans for Youth Racing and Adult Sailing
      And I've signed in
      When I open that Financial Plan
      Then the summary has a row for Youth Racing, Adult Sailing, Non-program, and the total
      And Youth Racing's row shows revenue of $10,000 and net of $5,000
      And under Programs I see Youth Racing's camp, with its sailors
      And I see the Financial Plan it was started from

  Rule: A Program Plan shows its full P&L, with its wages and its share of the shared costs

    Scenario: A Program Plan in a saved Financial Plan
      Given I'm a planner who can read plans
      And a saved Financial Plan whose Youth Racing offering took in $10,000, paid $3,000 of coaches' wages, and paid $1,000 of shared costs
      And I've signed in
      When I open Youth Racing's plan in that Financial Plan
      Then the offering shows $10,000 in, $3,000 of coaches' wages, and $1,000 of shared costs

    Scenario: A Program Plan in a draft
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Operations Plan pays coaches $30 an hour and has $1,000 of office costs
      And its only Program Plan has an offering with 100 hours of coaching
      And I've signed in
      When I open the Program Plan in the draft
      Then the offering pays $3,000 of coaches' wages
      And it pays the $1,000 of office costs

  Rule: A saved Financial Plan shows the P&L it was saved with, and never recalculates it

    Scenario: A Financial Plan started from it doesn't change its numbers
      Given I'm a planner who can read plans
      And a saved Financial Plan named "Budget" whose Youth Racing offering paid $1,000 of office costs
      And a Financial Plan started from "Budget" with $2,000 of office costs
      And I've signed in
      When I open Youth Racing's plan in "Budget"
      Then its offering shows $1,000 of office costs
      And the page says when "Budget" was saved

  Rule: A draft's P&L is calculated as I look at it

    Scenario: A draft shows what it would take in and spend today
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each
      And I've signed in
      When I open Youth Racing's plan in the draft
      Then its offering takes in $10,000
      And the page says the draft's numbers are calculated now, and will change as the plan does

  Rule: The P&L shows each offering's totals, per day, and per sailor-day, and remembers which

    Scenario: An offering's P&L, three ways
      Given I'm a planner who can read plans
      And a saved Financial Plan whose offering takes in $10,000 and spends $6,000 over 10 days, for 10 sailors
      And I've signed in
      When I open the offering's Program Plan in that Financial Plan
      Then the offering's net is $4,000
      And its net per day is $400
      And its net per sailor-day is $40
      And it's still per sailor-day when I come back to the page

  Rule: A plan shows the assumptions its numbers come from

    Scenario: An offering's price and sailors
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each
      And I've signed in
      When I open Youth Racing's plan in the draft
      Then its assumptions show the offering's 10 sailors at $1,000 each

  Rule: The planning engine's warnings show in words a planner understands

    Scenario: A practice on a closed day is pointed out
      Given I'm a planner who can read plans
      And a draft with a practice on a closed day
      And I've signed in
      When I open the draft
      Then the page warns that the practice falls on a closed day, and names the day

  Rule: A planner who can change plans can name a Financial Plan, note it, save it, mark it active, and start a draft from it

    Scenario: Renaming a draft and noting it
      Given I'm a planner who can change plans
      And a draft Financial Plan named "Two coaches"
      And I've signed in
      When I open "Two coaches"
      And I rename it "Two coaches, more boats" and note it "For the board"
      Then the page is titled "Two coaches, more boats" and shows the note "For the board"

    Scenario: A saved Financial Plan keeps its name
      Given I'm a planner who can change plans
      And a saved Financial Plan for 2027 named "Budget"
      And I've signed in
      When I open "Budget" and edit it
      Then I can change its note, but not its name

    Scenario: Starting a draft from a saved Financial Plan
      Given I'm a planner who can change plans
      And a saved Financial Plan for 2027 named "Budget"
      And I've signed in
      When I open "Budget" and start a draft from it named "Budget, three coaches"
      Then I'm on the draft "Budget, three coaches", started from "Budget"
      And it holds the same plans as "Budget"

    Scenario: A planner who can only read plans can't change them
      Given I'm a planner who can read plans
      And a saved Financial Plan for 2027 named "Budget"
      And I've signed in
      When I open "Budget"
      Then I see no way to edit it or start a draft from it

    Scenario: Saving a draft
      Given I'm a planner who can change plans
      And a draft Financial Plan named "Two coaches"
      And I've signed in
      When I open "Two coaches"
      And I save it
      Then it's marked saved, with the day it was saved

    Scenario: Marking a saved Financial Plan active
      Given I'm a planner who can change plans
      And a saved Financial Plan for 2027 named "Budget"
      And I've signed in
      When I open "Budget"
      And I mark it active
      Then it's marked active

  Rule: Only someone who can read plans can see them

    Scenario: A coach who can't read plans doesn't see them
      Given I'm a coach who can't read plans
      And I've signed in
      When I open Plans
      Then the page says I don't have access to plans
      And no plan, version, or amount appears
