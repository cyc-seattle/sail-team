Feature: Inventory
  Inventory lists every boat, motor, and piece of equipment CSC owns, its boat classes, and the dry storage its boats
  take. A Catalog Writer changes them in the app. A Catalog Reader reads them.

  Scenario: A Catalog Writer adds a sailboat, and Storage counts its space
    Given I'm a Catalog Writer
    And a boat class whose boats each take 50 square feet
    And I've signed in
    When I open Inventory
    And I add a sailboat of that class with sail number 77
    Then the asset list shows it under Sailboats
    And Dry storage counts 50 square feet for the class

  Scenario: A Catalog Reader reads the asset list but can't change it
    Given I'm a Catalog Reader
    And I've signed in
    When I open Inventory
    Then I see the asset list
    And I can't add an asset
