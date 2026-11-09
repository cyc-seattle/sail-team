Feature: Signing in to sail-team
  sail-team has no sign-in of its own. Directus decides who someone is and what they may see, and the app
  shows only what Directus lets them read. These journeys run in a browser against dev, as people made
  up for each run.

  Scenario: Someone who isn't signed in is sent to sign in
    When I open Planning without signing in
    Then I'm on the club's sign-in page

  Scenario: Signing in brings me back to the page I opened
    Given I'm a planner who can read plans
    When I open Planning
    And I sign in
    Then I'm back on Planning
    And the page shows my name

  Scenario: Someone who can't read plans is told so, not shown a blank page
    Given I'm a parent who can't read plans
    When I open Planning
    And I sign in
    Then the page says I don't have access to plans
    And it shows no plans
