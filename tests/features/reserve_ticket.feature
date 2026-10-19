Feature: Ticket Reservation

  Scenario: Successful ticket reservation for an available event
    Given an event with ID "event-100" has available tickets
    And the user "user-42" is authenticated
    When the user requests to reserve a ticket for "event-100"
    Then the system should lock 1 available ticket
    And the ticket status should change to "RESERVED"
    And the ticket should be reserved for 15 minutes
    And the system should return the reservation details

  Scenario: Failed ticket reservation for a sold-out event
    Given an event with ID "event-100" has 0 available tickets
    When the user "user-42" requests to reserve a ticket for "event-100"
    Then the system should throw an "Event is sold out" error
    And no changes should be persisted to the database