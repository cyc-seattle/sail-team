Feature: Household
  Household shows everyone in the signed-in parent's household: the people Clubspot links through a shared sailor. A
  parent changes how each person's name shows, their own phone and their children's, and a child's school. Emails
  can't be changed here, and a co-parent's phone is theirs to change. The household makes one choice, for everyone in
  it, whether to share its parents' email and phone with its teams. Every household here is made up for the run.

  Rule: A parent sees everyone in their household, and changes what's theirs to change

    Scenario: A parent changes their child's name and school, and their own phone
      Given I'm a parent with a co-parent and a child on a team
      And I've signed in
      When I open Household
      Then I see myself, my co-parent, and my child
      When I change my child's name to "Addie" and their school to "Eastlake High School"
      And I change my phone to "+1 206 555 0199"
      Then my child shows as Addie, at Eastlake High School
      And my household has my new phone and my child's new name and school

    Scenario: A parent can't change their co-parent's phone
      Given I'm a parent with a co-parent and a child on a team
      And I've signed in
      When I open Household
      And I edit my co-parent
      Then I can change their name, but not their phone

  Rule: The household decides once whether to share its parents' email and phone

    Scenario: A parent stops sharing, then shares again
      Given I'm a parent with a co-parent and a child on a team, and our household shares
      And I've signed in
      When I open Household
      And I stop sharing our email and phone numbers
      Then my household is down as not sharing
      When I share them again
      Then my household is down as sharing
