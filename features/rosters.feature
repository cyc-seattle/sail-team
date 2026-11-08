Feature: Team rosters
  Rosters shows one team at a time: a part of the club's programs, such as Doublehanded, whose team programs, such as
  J-Pod and K-Pod, are its divisions. It opens on the person's own team, and lists each sailor with their division,
  school, and guardians, and how to reach the guardians who chose to share their email and phone. It narrows to one of
  the team's divisions or a school, and a search finds anyone on any team by a sailor's or a guardian's name. Only
  households on a team and Crew see the rosters. Every adult decides on the page whether to share their own email and
  phone. Every household and program here is made up for the run.

  Rule: A household on a team sees the team, with the email and phone of the adults who share them

    Scenario: A guardian sees their child's teammates, and how to reach the guardians who share
      Given I'm a guardian whose child is on a team
      And a teammate whose guardian shares their email and phone
      And a teammate whose guardian doesn't share
      And I've signed in
      When I open Rosters
      Then the roster shows my child and both teammates
      And the roster shows the sharing guardian's email and phone
      And the roster says the other guardian hasn't shared

  Rule: The roster shows one team at a time, narrows to a division or a school, and finds people on any team by name

    Scenario: A guardian narrows the roster to a division, then to a school
      Given I'm a guardian whose child is on a team, at Lakeside Middle School
      And the team's division has a Google Group
      And a second division of the team, with a sailor at Eastlake High School
      And I've signed in
      When I open Rosters
      Then the roster is on my child's team
      And the roster shows my child and the sailor at Eastlake High School, with their schools
      And the roster links the division's Google Group
      When I pick the second division
      Then the roster shows only the sailor at Eastlake High School
      When I pick the whole team, and Lakeside Middle School
      Then the roster shows only my child
      And the page's address keeps the filters, so I can share it

    Scenario: A guardian finds a teammate by searching for the teammate's guardian
      Given I'm a guardian whose child is on a team
      And a teammate whose guardian shares their email and phone
      And a teammate whose guardian doesn't share
      And I've signed in
      When I open Rosters
      And I search for the sharing guardian's name
      Then the roster shows only that guardian's child, with the guardian's email and phone

  Rule: A household on no team sees no rosters

    Scenario: A guardian whose child is in a program that isn't a team can't open Rosters
      Given I'm a guardian whose child is in a program that isn't a team
      And I've signed in
      Then I don't see Rosters in the menu
      When I open Rosters
      Then the page says I don't have access to rosters

  Rule: Crew see every team, with everyone's email and phone

    Scenario: A Crew member sees how to reach a guardian who doesn't share
      Given I'm on the Crew
      And a team with a sailor whose guardian doesn't share
      And I've signed in
      When I open Rosters
      And I search for that guardian's name
      Then the roster shows that guardian's email and phone

  Rule: Each adult decides whether to share their own email and phone

    Scenario: A guardian stops sharing, then shares again
      Given I'm a guardian whose child is on a team, and I share my email and phone
      And I've signed in
      When I open Rosters
      And I stop sharing my email and phone with my child's team
      Then the club has me down as not sharing
      When I share them again
      Then the club has me down as sharing
