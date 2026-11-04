Feature: Rosters
  Rosters shows who's signed up for each program now, or most recently, and how to reach the adults who chose to
  share their email and phone. Directus decides who each person sees: a family on a team sees everyone on the teams,
  a family on no team sees only their own family, and Crew see everyone. Every adult decides on the page whether to
  share their own email and phone. Every family and program here is made up for the run.

  Rule: A family on a team sees the team, with the email and phone of the adults who share them

    Scenario: A parent sees their child's teammates, and how to reach the parents who share
      Given I'm a parent whose child is on a team
      And a teammate whose parent shares their email and phone
      And a teammate whose parent doesn't share
      And I've signed in
      When I open Rosters
      Then the team's roster shows my child and both teammates
      And it shows the sharing parent's email and phone
      And it names the other parent as their child's parent, with no email or phone

  Rule: A family on no team sees only their own family

    Scenario: A parent whose child is in a program that isn't a team sees only their own child
      Given I'm a parent whose child is in a program that isn't a team
      And another sailor in the program, whose parent shares their email and phone
      And I've signed in
      When I open Rosters
      Then the program's roster shows my child
      But not the other sailor or their parent

  Rule: Crew see every roster, with everyone's email and phone

    Scenario: A Crew member sees how to reach a parent who doesn't share
      Given I'm on the Crew
      And a team with a sailor whose parent doesn't share
      And I've signed in
      When I open Rosters
      Then the team's roster shows that parent's email and phone

  Rule: Each adult decides whether to share their own email and phone

    Scenario: A parent stops sharing, then shares again
      Given I'm a parent whose child is on a team, and I share my email and phone
      And I've signed in
      When I open Rosters
      And I stop sharing my email and phone with my child's team
      Then the club has me down as not sharing
      When I share them again
      Then the club has me down as sharing
