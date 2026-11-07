Feature: Seeing the financial model
  A financial model is the whole plan for a year, frozen: the Operations Plan's active version and each
  program area's, with the P&L they make together. A planner saves one through their AI, and it never
  changes. A later one can follow. Plans shows the newest one for each year, and whether the plans have
  moved on since. Every plan and number here is made up for the run. "The year" is a far-off year of the
  run's own, so no other run's financial model for it shows up.

  Rule: Each year shows its financial model, with its totals

    Scenario: A year's newest financial model shows what comes in and goes out
      Given I'm a planner who can read plans
      And the financial model for the year was saved today, with an operating net of $5,000
      And I've signed in
      When I open Plans
      Then the year shows its financial model, saved today
      And the financial model's operating net is $5,000

    Scenario: A year with no financial model says so
      Given I'm a planner who can read plans
      And there are plans for the year, but no financial model for it
      And I've signed in
      When I open Plans
      Then the year says it has no financial model yet

  Rule: A financial model shows each program area's P&L as it was when the financial model was saved

    Scenario: An area's P&L in the financial model
      Given I'm a planner who can read plans
      And a saved financial model whose Youth Racing offering took in $10,000 and spent $6,000
      And I've signed in
      When I open that financial model
      Then Youth Racing's offering shows $10,000 in and $6,000 out
      And the page says these are the numbers the financial model was saved with

  Rule: A financial model says when the plans have moved on since it was saved

    Scenario: An area made another version active after the financial model
      Given I'm a planner who can read plans
      And a saved financial model, then a newer Youth Racing version made active
      And I've signed in
      When I open that financial model
      Then the page says Youth Racing has moved on since the financial model was saved
      And it offers the financial model as it stands now, calculated now

  Rule: A saved version shows its P&L in the financial model that holds it

    Scenario: A saved area version, as the financial model holds it
      Given I'm a planner who can read plans
      And a saved Youth Racing version that the newest financial model holds
      And I've signed in
      When I open that saved version
      Then the page shows the version's own P&L, as the financial model stood when it was saved
      And it shows the version's P&L in the financial model that holds it

  Rule: Only someone who can read plans can see financial models

    Scenario: A coach who can't read plans doesn't see financial models
      Given I'm a coach who can't read plans
      And a saved financial model for 2027
      And I've signed in
      When I open Plans
      Then the page says I don't have access to plans
      And no financial model or amount appears
