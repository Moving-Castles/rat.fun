<!-- H.E.R.P -->

HERP is simple set of constraints for managing shared state for ingame actions and animations.

<!-- HUMAN
      EVENT
        READABILITY
          PROTOCOL
            -->

It aims to solve a challenge we often find in games with intricate interfaces.
It is applied here in a Svelte application.

It consists of three implementation steps and one extra documentation principle

The steps are

1. Store
2. Event
3. State

## Store

Stores in Svelte are where the state of the application is reflected. This is the listening step. The Store is always monitored for changes, which will trigger Events

## Events

Events here, are the keystone to solving complexity. Inside HERP's configuration we are defining Events. These will also serve as documentation. An Event essentially consists of:

1. Event Name
2. Event Description: A description for documentation purposes
3. Conditions: The store conditions to trigger this event
4. State Function: A function to update state, and trigger sound / visual effects or navigations

## State

State is the final step. In this step, the game state is updated.

## Considerations

This protocol relies on your component code to be properly written and configured with HERP front of mind.
