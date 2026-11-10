Feature: Getting around
  Every page someone can open is one tap or click away. On a laptop, the sidebar beside the page lists them all, with
  the account menu at its foot. On a phone, the first few are tabs along the bottom, and More opens the same sidebar,
  with the rest and the account menu. Links, in the sidebar, opens the other sites the person's role uses. These journeys run at a typical laptop's size (1440 × 900) and a typical
  phone's (390 × 844).

  Scenario Outline: A staff member opens every page on a <screen>
    Given I'm on the Crew
    And I can read plans
    And I'm on a <screen>
    And I've signed in
    Then I can open Home, Planning, and Rosters from the menu
    And my account menu shows my name

    Examples:
      | screen |
      | laptop |
      | phone  |

  Scenario Outline: A parent on a team opens their pages on a <screen>
    Given I'm a guardian whose child is on a team
    And I'm on a <screen>
    And I've signed in
    Then I can open Home, Rosters, and Household from the menu
    But the menu doesn't offer Planning
    And my account menu shows my name

    Examples:
      | screen |
      | laptop |
      | phone  |

  Scenario Outline: Links offers the sites a <role> user uses, on a <screen>
    Given I have the <role> role
    And I'm on a <screen>
    And I've signed in
    When I open Links in the menu
    Then Links offers only <links>

    Examples:
      | role      | screen | links                                                          |
      | Community | phone  | Google Calendar and Support                                    |
      | Crew      | laptop | the Clubspot dashboard, Google Calendar, and Support           |
      | Staff     | laptop | the Clubspot dashboard, Directus, Google Calendar, and Support |
