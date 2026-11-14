Feature: The home page
  cycsail.team's home page lists announcements, newest first. Everyone who signs in reads all of them.

  Scenario: A planner signs in and reads today's announcement
    Given I'm a planner who can read plans
    And an announcement posted today
    When I open the home page
    And I sign in
    Then the home page shows today's announcement

  Scenario: A parent reads the newest announcement first
    Given I'm a parent who can't read plans
    And an announcement posted today and one posted yesterday
    And I've signed in
    When I open the home page
    Then today's announcement comes before yesterday's
