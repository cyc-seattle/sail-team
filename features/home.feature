Feature: The home page
  cycsail.team's home page is a list of links: the pages of this app the person can open, then other sites the
  team uses.

  Scenario: A planner sees Plans among the links
    Given I'm a planner who can read plans
    When I open the home page
    And I sign in
    Then the home page links to Plans
    And it links to Clubspot and Google Calendar

  Scenario: Someone who can't read plans sees only the other sites
    Given I'm a parent who can't read plans
    And I've signed in
    When I open the home page
    Then the home page doesn't link to Plans
    And it links to Clubspot and Google Calendar
