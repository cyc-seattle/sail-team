Feature: Seeing the Financial Plans
  A Financial Plan is the organization's plan for one year. It holds one Operations Plan and a Program Plan for any
  of the organization's program areas, and the P&L they make together. Planners work on it as a whole, through their
  AI: it starts as a draft, and when it's ready a planner saves it. A saved Financial Plan and its plans never
  change. To change the plan after that, a planner starts the next version, which begins as a copy of the last saved
  one. The versions are numbered for each year, such as 2027 v1 and 2027 v2, and each has a note that says what it
  was for, such as "Reviewed with the board".

  Plans is where planners, and anyone else who can read plans, see the Financial Plans and what each plan in them
  takes in and spends. A Program Plan's P&L includes its coaches' wages, its RIBs, and its share of the shared
  costs, such as the office, worked out with the other plans in the same Financial Plan. Plans only shows plans; it
  doesn't change them. Every plan and number here is made up for the run.

  @fixme
  Rule: Plans lists each year's Financial Plans, newest version first, with their notes

    Scenario: Two saved versions of a year's plan
      Given I'm a planner who can read plans
      And 2027 v1 was saved with the note "Reviewed with the board", and 2027 v2 with the note "Adopted"
      And I've signed in
      When I open Plans
      Then under 2027 I see 2027 v2, then 2027 v1
      And each shows its note and the day it was saved

    Scenario: Each Financial Plan shows its operating net
      Given I'm a planner who can read plans
      And a saved Financial Plan, 2027 v1, with an operating net of $5,000
      And I've signed in
      When I open Plans
      Then 2027 v1 shows an operating net of $5,000

    Scenario: A draft is listed above the saved versions
      Given I'm a planner who can read plans
      And a saved Financial Plan, 2027 v1, and a draft of 2027 v2
      And I've signed in
      When I open Plans
      Then under 2027 I see 2027 v2, marked as a draft, then 2027 v1

  @fixme
  Rule: A Financial Plan shows the organization's totals, and each of its plans

    Scenario: A Financial Plan with an Operations Plan and two Program Plans
      Given I'm a planner who can read plans
      And a saved Financial Plan with an Operations Plan, and Program Plans for Youth Racing and Adult Sailing
      And I've signed in
      When I open that Financial Plan
      Then I see the organization's operating net, fundraising, capital, and total
      And I see its Operations Plan and both Program Plans, each with its net

  @fixme
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

  @fixme
  Rule: A saved Financial Plan shows the P&L it was saved with, and never recalculates it

    Scenario: A later version doesn't change an earlier one's numbers
      Given I'm a planner who can read plans
      And a saved Financial Plan, 2027 v1, whose Youth Racing offering paid $1,000 of office costs
      And 2027 v2, which has $2,000 of office costs
      And I've signed in
      When I open Youth Racing's plan in 2027 v1
      Then its offering shows $1,000 of office costs
      And the page says when 2027 v1 was saved, and who saved it

  @fixme
  Rule: A draft's P&L is calculated as I look at it

    Scenario: A draft shows what it would take in and spend today
      Given I'm a planner who can read plans
      And a draft Financial Plan whose Youth Racing plan has one offering of 10 sailors at $1,000 each
      And I've signed in
      When I open Youth Racing's plan in the draft
      Then its offering takes in $10,000
      And the page says the draft's numbers are calculated now, and will change as the plan does

  @fixme
  Rule: The P&L shows each offering's totals, per day, and per sailor-day

    Scenario: An offering's P&L, three ways
      Given I'm a planner who can read plans
      And a saved Financial Plan whose offering takes in $10,000 and spends $6,000 over 10 days, for 10 sailors
      And I've signed in
      When I open the offering's Program Plan in that Financial Plan
      Then the offering's net is $4,000
      And its net per day is $400
      And its net per sailor-day is $40

  Rule: The planning engine's warnings show in words a planner understands

    Scenario: A practice on a closed day is pointed out
      Given I'm a planner who can read plans
      And a draft with a practice on a closed day
      And I've signed in
      When I open the draft
      Then the page warns that the practice falls on a closed day, and names the day

  Rule: Only someone who can read plans can see them

    Scenario: A coach who can't read plans doesn't see them
      Given I'm a coach who can't read plans
      And I've signed in
      When I open Plans
      Then the page says I don't have access to plans
      And no plan, version, or amount appears
