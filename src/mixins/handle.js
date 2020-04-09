import yargsParser from 'yargs-parser'

import { createStdout, createDummyStdout } from '../library'

// @vue/component
export default {
  methods: {
    // Handles the command
    async handle (stdin) {
      this.$emit('execute')
      this.setIsInProgress(true)

      // Remove leading and trailing whitespace
      stdin = stdin.trim()

      const program = yargsParser(stdin, this.yargsOptions)._[0]

      // Check if function is built in
      if (this.builtIn[program] !== undefined) {
        // Parse the command
        const parsed = yargsParser(stdin, this.yargsOptions)

        let component = await Promise.resolve(this.builtIn[program](parsed))
        component = this.setupComponent(component, this.history.length, parsed)

        let history = [...this.history]
        history.push(component)
        this.$emit('update:history', [...history])

        // The built in function must take care of all other steps
        return
      }

      // Create empty component in case no program has been found
      let component = createDummyStdout()
      // Check if command has been found
      if (typeof this.commands[program] === 'function') {
        // Parse the command and try to get the program
        const parsed = yargsParser(stdin, this.yargsOptions)

        component = await Promise.resolve(this.commands[program](parsed))
        component = this.setupComponent(component, this.history.length, parsed)

        // Remove duplicate commands to push to latest entry
        let executed = new Set(this.executed)
        executed.delete(stdin)
        executed.add(stdin)
        this.$emit('update:executed', executed)
      } else {
        // No command found
        if (stdin !== '') {
          component = createStdout(`${stdin}: ${this.notFound}`, true)
        }

        component = this.setupComponent(component, this.history.length)
      }

      let history = [...this.history]
      history.push(component)
      this.$emit('update:history', [...history])
    },

    // Add environment and instantly terminate
    setupComponent (component, history = 0, parsed = {}) {
      // Prevent to work with same reference
      component = { ...component }

      if (!hasOwnProperty.call(component, 'computed')) {
        component.computed = {}
      }
      component.computed = {
        environment: () => ({
          isExecuting: this.isInProgress && (this.history.length - 1 === history),
          isFullscreen: this.isFullscreen,
          isInProgress: this.isInProgress
        }),

        context: () => ({
          cursor: this.cursor,
          parsed
        }),

        ...component.computed
      }

      return component
    }
  }
}
