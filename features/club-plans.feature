Feature: Seeing the club's plan
  A club plan is the whole club's plan for a year, frozen: the Operations Plan's active version and each
  program area's, with the P&L they make together. A planner saves one through their AI, and it never
  changes. A later one can follow. Plans shows the newest one for each year, and whether the club has
  moved on since. Every plan and number here is made up for the run. "The year" is a far-off year of the
  run's own, so no other run's club plan for it shows up.

  Rule: Each year shows its club plan, with the club's totals

    Scenario: A year's newest club plan shows what the club takes in and spends
      Given I'm a planner who can read plans
      And the club's plan for the year was saved today, with an operating net of $5,000
      And I've signed in
      When I open Plans
      Then the year shows its club plan, saved today
      And the club plan's operating net is $5,000

    Scenario: A year with no club plan says so
      Given I'm a planner who can read plans
      And the club has plans for the year, but no club plan for it
      And I've signed in
      When I open Plans
      Then the year says the club has no club plan for it yet

  Rule: A club plan shows each program area's P&L as it was when the club plan was saved

    Scenario: An area's P&L in the club plan
      Given I'm a planner who can read plans
      And a saved club plan whose Youth Racing offering took in $10,000 and spent $6,000
      And I've signed in
      When I open that club plan
      Then Youth Racing's offering shows $10,000 in and $6,000 out
      And the page says these are the numbers the club plan was saved with

  Rule: A club plan says when the club has moved on since it was saved

    Scenario: An area made another version active after the club plan
      Given I'm a planner who can read plans
      And a saved club plan, then a newer Youth Racing version made active
      And I've signed in
      When I open that club plan
      Then the page says Youth Racing has moved on since the club plan was saved
      And it offers the club's plan as it stands now, calculated now

  Rule: A saved version shows its P&L in the club plan that holds it

    Scenario: A saved area version, as the club plan holds it
      Given I'm a planner who can read plans
      And a saved Youth Racing version that the newest club plan holds
      And I've signed in
      When I open that saved version
      Then the page shows the version's own P&L, as the club's plan stood when it was saved
      And it shows the version's P&L in the club plan that holds it

  Rule: Only someone who can read plans can see club plans

    Scenario: A coach who can't read plans doesn't see club plans
      Given I'm a coach who can't read plans
      And a saved club plan for 2027
      And I've signed in
      When I open Plans
      Then the page says I don't have access to plans
      And no club plan or amount appears
