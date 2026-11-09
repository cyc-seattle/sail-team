Feature: Team rosters
  Rosters shows each team: a part of the club's programs, such as Doublehanded, whose team programs, such as J-Pod
  and K-Pod, are its divisions. Each team has its own page, with its sailors grouped by division or by school, and how
  to reach the parents who chose to share their email and phone. Only households on a team and Crew see the rosters.
  Each household decides on its Household page whether to share its parents' email and phone. Every household and
  program here is made up for the run.

  Rule: A household on a team sees the team, with the email and phone of the adults who share them

    Scenario: A parent sees their child's teammates, and how to reach the parents who share
      Given I'm a parent whose child is on a team
      And a teammate whose parent shares their email and phone
      And a teammate whose parent doesn't share
      And I've signed in
      When I open my child's team from Rosters
      Then the roster shows my child and both teammates
      And the sharing parent's card shows their email and phone
      And the other parent's card says they haven't shared

  Rule: A team's roster groups its sailors by division or by school, with totals

    Scenario: A parent sees the team by division, then by school
      Given I'm a parent whose child is on a team, at Lakeside Middle School
      And the team's division has a Google Group
      And a second division of the team, with a sailor at Eastlake High School
      And I've signed in
      When I open my child's team from Rosters
      Then the team has 2 sailors in all
      And each division shows its 1 sailor
      And the roster links the division's Google Group
      When I group the team by school
      Then Lakeside Middle School and Eastlake High School each show their 1 sailor
      And the page's address keeps the grouping, so I can share it

  Rule: A household on no team sees no rosters

    Scenario: A parent whose child is in a program that isn't a team can't open Rosters
      Given I'm a parent whose child is in a program that isn't a team
      And I've signed in
      Then I don't see Rosters in the menu
      When I open Rosters
      Then the page says I don't have access to rosters

  Rule: Crew see every team, with everyone's email and phone

    Scenario: A Crew member sees how to reach a parent who doesn't share
      Given I'm on the Crew
      And a team with a sailor whose parent doesn't share
      And I've signed in
      When I open that team from Rosters
      Then that parent's card shows their email and phone
