Feature: Household
  Household shows everyone in the signed-in person's household: the people Clubspot links through a shared sailor.
  Anyone in it, children included, changes how each person's name shows, their phone, and a sailor's school, which is
  picked from a list of schools, or typed in after choosing Other. Emails can't be changed here. The household makes
  one choice, for everyone in it, whether to share its adults' email and phone with its teammates, and only an adult
  makes it. Every household here is made up for the run.

  Rule: Anyone in a household changes anyone in it

    Scenario: A guardian changes their child's name and school, and their own phone
      Given I'm a guardian with another guardian and a child on a team
      And I've signed in
      When I open Household
      Then I see myself, the other guardian, and my child
      When I change my child's name to "Addie" and their school to "Salish Sea Academy", which isn't on the list
      And I change my phone to "206 555 0199"
      Then my child shows as Addie, at Salish Sea Academy
      And my phone shows as "(206) 555-0199"
      And my household has my new phone and my child's new name and school

    Scenario: A guardian changes the other guardian's phone
      Given I'm a guardian with another guardian and a child on a team
      And I've signed in
      When I open Household
      And I change the other guardian's phone to "206 555 0188"
      Then the other guardian's phone shows as "(206) 555-0188"

  Rule: The household decides once whether to share its adults' email and phone

    Scenario: A guardian stops sharing, then shares again
      Given I'm a guardian with another guardian and a child on a team, and our household shares
      And I've signed in
      When I open Household
      And I stop sharing our email and phone numbers
      Then my household is down as not sharing
      When I share them again
      Then my household is down as sharing
