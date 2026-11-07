Feature: Tracking the year
  Tracking shows a program area's directors how the year is going against its plan. It compares each planned
  offering with what has happened in Clubspot: how many sailors have registered, and how much money has come in. It
  covers one program area for the year of the active Financial Plan, the one a planner has marked as the plan being
  run. There are no terms or seasons, because not every program has them, so the offerings are listed by date.

  A catalog offering is a named offering of a program, such as Guppies Summer, kept in the catalog rather than in any
  one Financial Plan. A planned offering is a catalog offering in the active Financial Plan, with its price and the
  number of sailors expected. A Clubspot offering is what families sign up for: one class in one session, such as
  Guppies week 3. A planner links each Clubspot offering to its catalog offering once, and several can link to one.
  When another Financial Plan becomes active, nothing is linked again. Money collected is what families have paid,
  less refunds. Every program, family and figure here is made up for the run.

  Rule: A planner sees each planned offering's sailors and money against the plan

    @fixme
    Scenario: A planner sees registered sailors and money collected for each planned offering
      Given I'm a planner who can read plans
      And Youth Racing's active Financial Plan expects 10 sailors in Guppies Summer at $400 each
      And 6 sailors have registered for Guppies Summer in Clubspot, and their families have paid $2,000
      And I've signed in
      When I open Tracking for Youth Racing
      Then Guppies Summer shows 6 of 10 sailors registered
      And it shows $2,000 collected of $4,000 planned

    @fixme
    Scenario: The planned offerings are listed by date
      Given I'm a planner who can read plans
      And Youth Racing's active Financial Plan has Opti Fall, starting in September, and Guppies Summer, starting in June
      And I've signed in
      When I open Tracking for Youth Racing
      Then I see Guppies Summer, then Opti Fall

    @fixme
    Scenario: The page shows the year's totals and which Financial Plan it compares against
      Given I'm a planner who can read plans
      And Youth Racing's active Financial Plan, "Board budget", has two planned offerings
      And I've signed in
      When I open Tracking for Youth Racing
      Then the page says it compares against "Board budget"
      And it shows the year's total collected, planned revenue, and sailors registered against planned

  Rule: A planner links a Clubspot offering that isn't in the plan yet

    @fixme
    Scenario: A planner links a Clubspot offering from the list of those not in the plan
      Given I'm a planner who can change plans
      And a catalog offering, Guppies Summer, that Youth Racing's active Financial Plan includes
      And a Clubspot offering, Guppies week 3, with 4 sailors, that isn't linked to anything
      And I've signed in
      When I open Tracking for Youth Racing
      Then Guppies week 3 is listed as not in the plan, with its 4 sailors
      When I link Guppies week 3 to Guppies Summer
      Then Guppies Summer counts its 4 sailors
      And Guppies week 3 is no longer listed as not in the plan

    @fixme
    Scenario: A planner who can only read plans can't link a Clubspot offering
      Given I'm a planner who can read plans
      And a Clubspot offering of a Youth Racing program that isn't linked to anything
      And I've signed in
      When I open Tracking for Youth Racing
      Then I see the Clubspot offering listed as not in the plan
      But I can't link it to a catalog offering

  Rule: A catalog offering the active Financial Plan doesn't include shows as not planned

    @fixme
    Scenario: A planner sees sailors registered for an offering the active plan doesn't include
      Given I'm a planner who can read plans
      And a Clubspot offering linked to Guppies Summer, with 4 sailors
      And Youth Racing's active Financial Plan doesn't include Guppies Summer
      And I've signed in
      When I open Tracking for Youth Racing
      Then Guppies Summer is listed as not planned, with its 4 sailors

  Rule: A payment that covers several offerings is shown split among them

    @fixme
    Scenario: A planner sees a payment split between two offerings
      Given I'm a planner who can read plans
      And Youth Racing's active Financial Plan has Guppies Summer at $400 and Opti Summer at $200
      And a family who paid $600 once for both
      And I've signed in
      When I open Tracking for Youth Racing
      Then Guppies Summer shows $400 collected and Opti Summer $200
      And the page lists that payment as split between them

  Rule: Only planners can see Tracking

    @fixme
    Scenario: A Crew member can't open Tracking
      Given I'm on the Crew
      And I've signed in
      When I open Tracking for Youth Racing
      Then I'm told I can't see Tracking
