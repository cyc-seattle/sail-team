Feature: Getting around
  Every page someone can open is one tap or click away. On a laptop, the sidebar beside the page lists them all, with
  the account menu at its foot. On a phone, the first few are tabs along the bottom, and More opens the same sidebar,
  with the rest and the account menu. Links opens a page of the other sites the team uses, and Support, just above the
  account menu, emails the office. The account menu also holds the tools the person's role uses. These journeys run at
  a typical laptop's size (1440 × 900) and a typical phone's (390 × 844).

  Scenario Outline: A staff member opens every page on a <screen>
    Given I'm on the Crew
    And I can read plans
    And I'm on a <screen>
    And I've signed in
    Then I can open Home, Planning, Rosters, and Links from the menu
    And the menu offers Support
    And my account menu shows my name, my email, and my role

    Examples:
      | screen |
      | laptop |
      | phone  |

  Scenario Outline: A parent on a team opens their pages on a <screen>
    Given I'm a guardian whose child is on a team
    And I'm on a <screen>
    And I've signed in
    Then I can open Home, Rosters, Household, and Links from the menu
    But the menu doesn't offer Planning
    And my account menu shows my name, my email, and my role

    Examples:
      | screen |
      | laptop |
      | phone  |

  Scenario Outline: Links shows the sites the team uses, on a <screen>
    Given I have the Community role
    And a link to the CSC website
    And I'm on a <screen>
    And I've signed in
    When I open Links from the menu
    Then Links shows the CSC website

    Examples:
      | screen |
      | laptop |
      | phone  |

  Scenario Outline: The account menu offers the tools a <role> user uses, on a <screen>
    Given I have the <role> role
    And I'm on a <screen>
    And I've signed in
    When I open my account menu
    Then it offers <tools>

    Examples:
      | role      | screen | tools                                                     |
      | Community | phone  | no tools                                                  |
      | Crew      | laptop | only the Clubspot dashboard                               |
      | Staff     | laptop | only the Clubspot dashboard and Directus                  |
      | Admin     | laptop | only the Clubspot dashboard, Directus, Sign in as someone |
