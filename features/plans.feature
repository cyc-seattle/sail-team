Feature: Seeing the Financial Plans
  A Financial Plan is the organization's plan for one year. It holds one Operations Plan and a Program Plan for any
  of the organization's program areas, and the P&L they make together. Planners work on it as a whole, through their
  AI: it starts as a draft, and when it's ready a planner freezes it. A draft's numbers are worked out again after every
  change to it, wherever the change is made. A frozen Financial Plan's plans and numbers never change, though its name
  and note can. To change the plan after that, a planner duplicates it, and the copy begins as a draft. A plan no one
  needs any more can be archived, which takes it off Planning's list until someone asks to see archived plans. A year can have several drafts at once, so planners can weigh options, such as
  two drafts started from the same Financial Plan, one with two coaches and one with three. Each Financial Plan has a
  name, and a note that says what it was for, such as "Reviewed with the board".

  A plan's activities are grouped into blocks, one date each, and each block is given its staff, RIBs and boats. Each
  program has its settings: the staff level that leads it, and how many sailors one of them can take. Rules, in the
  planner's own words, say what the settings can't, for the planner's AI to follow. The engine costs what the blocks
  are given, and warns where they break a limit, such as a practice on a day CSC is closed.

  Planning is where planners, and anyone else who can read plans, see the Financial Plans as a set of reports: an
  Overview, the Assumptions, one for each program area, Non-program, and Fundraising and capital. A program area's
  report includes its coaches' wages, its RIBs, and its share of the shared costs, such as the office, worked out with
  the other plans in the same Financial Plan. A planner who can change plans can rename any Financial Plan, change its
  note, freeze a draft, delete one, mark a frozen one active, archive one, and duplicate one here. Everything else about
  a plan is changed through their AI. Every plan and number here is made up for the run.

  Rule: Planning lists every Financial Plan in one table, by year and status

    Scenario: A frozen Financial Plan and a draft started from it
      Given I'm a planner who can read plans
      And a frozen Financial Plan for 2027 named "Budget", noted "Reviewed with the board"
      And a draft started from it named "Two coaches"
      And I've signed in
      When I open Planning for 2027
      Then I see "Budget", marked frozen, and "Two coaches", marked as a draft
      And "Budget" shows its note and the day it was frozen
      And "Two coaches" shows it was started from "Budget"

    Scenario: Each Financial Plan shows its operating revenue, expenses, and net, leaving out fundraising
      Given I'm a planner who can read plans
      And a frozen Financial Plan for 2027 whose camp takes in $10,000 and spends $5,000 running it, with $2,000 of donations
      And I've signed in
      When I open Planning for 2027
      Then "Budget" shows revenue of $10,000, expenses of $5,000, and net of $5,000

  Rule: A Financial Plan's Overview shows each program area from revenue to net, and Non-program on its own

    Scenario: A Financial Plan with an Operations Plan and two Program Plans
      Given I'm a planner who can read plans
      And a frozen Financial Plan with an Operations Plan, and Program Plans for Youth Racing and Adult Sailing
      And I've signed in
      When I open that Financial Plan
      Then its Overview has a row for Youth Racing, Adult Sailing, and all program areas
      And Non-program has its own section
      And Youth Racing's row shows revenue of $10,000 and net of $5,000
      And I can switch to Assumptions, Youth Racing, Adult Sailing, Non-program, and Fundraising and capital

  Rule: A program area's report shows its revenue and expenses, with its wages and its share of the shared costs

    Scenario: A Program Plan in a frozen Financial Plan
      Given I'm a planner who can read plans
      And a frozen Financial Plan whose Youth Racing offering took in $10,000, paid $3,000 of coaches' wages, and paid $1,000 of shared costs
      And I've signed in
      When I open Youth Racing's report in that Financial Plan
      Then it shows $10,000 of revenue, $3,000 of coaches' wages, and $1,000 of the office
      And opening the coaches' wages shows how they were worked out

    Scenario: A Program Plan in a draft
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Operations Plan pays coaches $30 an hour and has $1,000 of office costs
      And its only Program Plan has an offering with a coach on every practice, 100 hours in all
      And I've signed in
      When I open Youth Racing's report in the draft
      Then it shows $3,000 of coaches' wages
      And it shows the $1,000 of the office

  Rule: A program area's report shows its P&L for each season, with each season's bonus, since bonuses are paid per season

    Scenario: A director's bonus when the fall loses money
      Given I'm a planner who can read plans
      And a Financial Plan that pays Youth Racing's director 10% of each season's net
      And Youth Racing makes $20,000 in the summer and loses $5,000 in the fall, and the Financial Plan is frozen
      And I've signed in
      When I open Youth Racing's report in that Financial Plan
      Then its summer shows a $2,000 bonus for the director, and its fall shows none

  Rule: A frozen Financial Plan shows the P&L it was frozen with, and never recalculates it

    Scenario: A Financial Plan started from it doesn't change its numbers
      Given I'm a planner who can read plans
      And a frozen Financial Plan named "Budget" whose Youth Racing offering paid $1,000 of office costs
      And a Financial Plan started from "Budget" with $2,000 of office costs
      And I've signed in
      When I open Youth Racing's report in "Budget"
      Then it shows the $1,000 of the office

  Rule: A draft's P&L is worked out again after every change to it, wherever the change is made

    Scenario: A draft's numbers follow a change made through a planner's AI
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each
      And I've signed in
      When I open Youth Racing's report in the draft
      And a planner's AI raises the offering's price to $1,200
      Then it shows $12,000 of revenue, without my reloading the page

  Rule: A program area's report shows its programs' settings and rules, and each offering's fee and sailors

    Scenario: An offering's fee and sailors, and its program's settings
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each
      And its program is led by a Lead coach, at 5 sailors per coach, with the rule "Sail in pairs"
      And I've signed in
      When I open Youth Racing's report in the draft
      Then its offering shows a fee of $1,000 and 10 sailors
      And its assumptions show the program's Lead coach, 5 sailors per coach, and the rule "Sail in pairs"

  Rule: Assumptions show the rules every program follows and the rates every plan uses

    Scenario: The Operations Plan's rules and a coach's pay
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Operations Plan pays coaches $30 an hour and has $1,000 of office costs
      And the Operations Plan's rule "No more than 4 RIBs on the water"
      And I've signed in
      When I open the draft's Assumptions
      Then I see the rule "No more than 4 RIBs on the water"
      And I see the coach's pay of $30.00 an hour

  Rule: The Calendar shows each program area's offerings over the year, then a day's activity blocks at their times

    Scenario: A day's practice that differs from the others
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each
      And it practices each weekday morning for two weeks with a Lead coach, but the last day has no coach yet
      And I've signed in
      When I open Youth Racing's report in the draft
      And I see it on the calendar
      Then the calendar shows the offering's 10 sailors across both weeks
      When I open the practice on Jul 16
      Then it has no staff, coach boats or boats yet, where the other days have 1 Lead coach

  Rule: The planning engine's warnings are listed at the top of the Overview and each program area's report, all shown once opened

    Scenario: A practice on a closed day is pointed out
      Given I'm a planner who can read plans
      And a draft with a practice on a closed day
      And I've signed in
      When I open the draft
      And I open its warnings
      Then a warning says the practice falls on a closed day, on that day

  Rule: A planner who can change plans can rename a Financial Plan, note it, freeze it, delete it, mark it active, archive it, and duplicate it

    Scenario: Renaming a draft and noting it
      Given I'm a planner who can change plans
      And a draft Financial Plan named "Two coaches"
      And I've signed in
      When I open "Two coaches"
      And I rename it "Two coaches, more boats" and note it "For the board"
      Then the page is titled "Two coaches, more boats"
      And Planning shows "Two coaches, more boats" with the note "For the board"

    Scenario: Duplicating a frozen Financial Plan
      Given I'm a planner who can change plans
      And a frozen Financial Plan for 2027 named "Budget"
      And I've signed in
      When I open "Budget" and duplicate it as "Budget, three coaches"
      Then I'm on the draft "Budget, three coaches"
      And it holds the same plans as "Budget"

    Scenario: A planner who can only read plans can't change them
      Given I'm a planner who can read plans
      And a frozen Financial Plan for 2027 named "Budget"
      And I've signed in
      When I open "Budget"
      Then I see no way to edit it or duplicate it
      And Planning has no actions for "Budget"

    Scenario: Freezing a draft
      Given I'm a planner who can change plans
      And a draft Financial Plan named "Two coaches"
      And I've signed in
      When I open "Two coaches"
      And I freeze it
      Then it's marked frozen

    Scenario: Deleting a draft from Planning
      Given I'm a planner who can change plans
      And a draft Financial Plan named "Two coaches"
      And I've signed in
      When I open Planning for 2027
      And I delete "Two coaches"
      Then Planning no longer lists "Two coaches"

    Scenario: Archiving a frozen Financial Plan
      Given I'm a planner who can change plans
      And a frozen Financial Plan for 2027 named "Budget"
      And I've signed in
      When I open Planning for 2027
      And I archive "Budget"
      Then Planning no longer lists "Budget"
      And Planning lists "Budget" when I ask to see archived plans

    Scenario: Marking a frozen Financial Plan active
      Given I'm a planner who can change plans
      And a frozen Financial Plan for 2027 named "Budget"
      And I've signed in
      When I open "Budget"
      And I mark it active
      Then it's marked active

  Rule: Only someone who can read plans can see them

    Scenario: A coach who can't read plans doesn't see them
      Given I'm a coach who can't read plans
      And I've signed in
      When I open Planning
      Then the page says I don't have access to plans
      And no plan, version, or amount appears
