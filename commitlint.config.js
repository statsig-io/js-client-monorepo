module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        /**
         * Chore
         * Purpose: This tag is used for commits that involve routine tasks, maintenance, or general housekeeping in the codebase. Chore commits typically don't introduce new features, fix bugs, or change existing functionality.
         * Example: "chore: update dependency packages"
         */
        'chore',
        /**
         * Tool
         * Purpose: Commits tagged as 'tool' are related to changes in development tools, scripts, or configuration files that support the project but aren't part of the application's core functionality.
         * Example: "tool: configure development environment settings"
         */
        'tool',
        /**
         * Feature
         * Purpose: These commits are used to introduce new features or functionalities into the codebase. They represent the addition of new capabilities or enhancements..
         * Example: "feat: implement user authentication system"
         */
        'feat',
        /**
         * Fix
         * Purpose: The 'fix' tag is used when a commit addresses and resolves a specific bug or issue in the code. It signifies that the commit is focused on correcting a problem.
         * Example: "fix: resolve null pointer exception in user profile"
         */
        'fix',
        /**
         * Performance
         * Purpose: Commits tagged as 'perf' are used when improvements are made to the performance of the codebase. These changes optimize existing functionality for better speed or efficiency.
         * Example: "perf: optimize database query for faster response times"
         */
        'perf',
        /**
         * Refactor
         * Purpose: 'refac' commits involve code refactoring, which means restructuring existing code without changing its external behavior. This is done to improve code readability, maintainability, or adherence to coding standards.
         * Example: "refac: extract common utility function for code clarity"
         */
        'refac',
        /**
         * Revert
         * Purpose: Revert commits are used to undo previous commits. They are necessary when a change introduced in a previous commit needs to be undone due to issues or unintended consequences.
         * Example: "revert: revert previous commit 'feat: add experimental feature'"
         */
        'revert',
        /**
         * Test
         * Purpose:  Commits with the 'test' tag are related to testing and test suite modifications. They may include adding, modifying, or fixing tests to ensure the code functions correctly.
         * Example: "test: add unit tests for user authentication"
         */
        'test',
      ],
    ],
  },
};
