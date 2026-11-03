Feature: Seeing a plan's P&L
  Planners plan each year through their AI, over Directus's MCP. Plans is where they, and anyone else who can
  read plans, see the result: each plan, its versions, and what each version takes in and spends. It only
  shows plans; it doesn't change them. Every plan and number here is made up for the run.

  Rule: Someone who can read plans finds every plan, by year and program area

    @fixme
    Scenario: The plans page lists the plans for each year
      Given I'm a planner who can read plans
      And the club has a 2027 plan for Youth Racing and a 2027 Operations Plan
      When I open Plans
      Then I see both plans under 2027
      And each plan shows its program area, or "Operations Plan"

    @fixme
    Scenario: A plan shows its versions, newest first, with the active one marked
      Given I'm a planner who can read plans
      And Youth Racing's 2027 plan has a draft and two saved versions, the older one active
      When I open Youth Racing's 2027 plan
      Then I see the draft, then the newer saved version, then the older one
      And the older saved version is marked active

  Rule: A saved version shows the P&L it was saved with, and never recalculates it

    @fixme
    Scenario: A saved version keeps its numbers after the Operations Plan changes
      Given I'm a planner who can read plans
      And a saved version of Youth Racing's plan whose offering paid $1,000 of office costs when it was saved
      And a newer Operations Plan that charges $2,000 of office costs
      When I open that saved version
      Then its offering shows $1,000 of office costs
      And the page says when the version was saved, and who saved it

  Rule: A draft's P&L is calculated as I look at it

    @fixme
    Scenario: A draft shows what it would take in and spend today
      Given I'm a planner who can read plans
      And a draft of Youth Racing's plan with one offering of 10 sailors at $1,000 each
      When I open the draft
      Then its offering takes in $10,000
      And the page says the draft's numbers are calculated now, and will change as the plan does

  Rule: The P&L shows each offering's totals, per day, and per sailor-day

    @fixme
    Scenario: An offering's P&L, three ways
      Given I'm a planner who can read plans
      And a saved version whose offering takes in $10,000 and spends $6,000 over 10 days, for 10 sailors
      When I open that version
      Then the offering's net is $4,000
      And its net per day is $400
      And its net per sailor-day is $40

  Rule: The planning engine's warnings show in words a planner understands

    @fixme
    Scenario: A practice on a day the club is closed is pointed out
      Given I'm a planner who can read plans
      And a draft with a practice on a day the club is closed
      When I open the draft
      Then the page warns that the practice falls on a day the club is closed, and names the day

  Rule: Only someone who can read plans can see them

    @fixme
    Scenario: A coach who can't read plans doesn't see them
      Given I'm a coach who can't read plans
      When I open Plans
      Then the page says I don't have access to plans
      And no plan, version, or amount appears
