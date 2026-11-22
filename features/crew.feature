Feature: Crew
  Crew is everyone who works for CSC, volunteers and paid staff, each one someone already in People. A Crew Writer puts
  people in positions, records their qualifications, and keeps what the website shows of them. A Crew Reader reads it
  all but a position's pay. A crew member is missing a qualification when a position they hold today needs it and they
  don't have it, or one that covers it, in date. One that ends in the next 90 days is expiring.

  @fixme
  Scenario: A Crew Writer adds someone to Crew and puts them in a position
    Given I'm a Crew Writer
    And someone in People who isn't on Crew
    And I've signed in
    When I open Crew
    And I add them to Crew
    And I assign them the Sailing Instructor position in a program
    Then Crew lists them as a Sailing Instructor in that program

  @fixme
  Scenario: An expired first aid card counts as missing
    Given I'm a Crew Reader
    And a Sailing Instructor whose position needs First Aid and CPR
    And their First Aid and CPR expired last month
    And I've signed in
    When I open Crew
    Then Crew shows them missing First Aid and CPR

  @fixme
  Scenario: A qualification that covers another counts
    Given I'm a Crew Reader
    And a crew member in a position that needs US Sailing Level 1
    And they hold US Sailing Level 2, which covers it
    And I've signed in
    When I open Crew
    Then Crew shows them missing nothing

  @fixme
  Scenario: First aid ending in 52 days shows as expiring
    Given I'm a Crew Reader
    And a crew member whose First Aid and CPR ends in 52 days
    And I've signed in
    When I open Crew
    Then Crew shows their First Aid and CPR expiring

  @fixme
  Scenario: Someone whose positions have all ended is past, and needs nothing
    Given I'm a Crew Reader
    And a crew member whose only position ended last month
    And I've signed in
    When I open Crew and show Past
    Then Crew lists them, missing nothing

  @fixme
  Scenario: A Crew Reader can't see pay or change Crew
    Given I'm a Crew Reader
    And a crew member with a paid position
    And I've signed in
    When I open their page
    Then I don't see their pay
    And I can't assign a position, add a qualification, or change their website profile

  @fixme
  Scenario: Only Crew Readers and Writers see Crew
    Given I'm a Plan Reader
    And I've signed in
    Then Crew isn't in the sidebar
