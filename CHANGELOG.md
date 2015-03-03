# Changelog

## [2.0.0](https://github.com/scottcorgan/nash/issues?q=milestone%3A2.0+is%3Aclosed)

**Released on 3-2-2015**

* **[#30](https://github.com/scottcorgan/nash/issues/30)** - FIXED: Review command before and after async relation to the command
* **[#37](https://github.com/scottcorgan/nash/issues/37)** - BREAKING: handler arguments should be an object instead of separate arguments
* **[#39](https://github.com/scottcorgan/nash/issues/39)** - BREAKING: Remove Sync mode. Async mode only for commands, flags, and all the things.
* **[#42](https://github.com/scottcorgan/nash/issues/42)** - BREAKING: Flag assumed async
* **[#44](https://github.com/scottcorgan/nash/issues/44)** - BREAKING: Deprecate `exit()` method
* **[#45](https://github.com/scottcorgan/nash/issues/45)** - BREAKING: Remove deprecate methods
* **[#46](https://github.com/scottcorgan/nash/issues/46)** - BREAKING: deprecate `onInvalidCommand` in favor of `default()`
* **[#47](https://github.com/scottcorgan/nash/issues/47)** - Document running a command by name
* **[#49](https://github.com/scottcorgan/nash/issues/49)** - Remove remnants of built in usage screen  
* **[#52](https://github.com/scottcorgan/nash/issues/52)** - NEW: Create cli-level process object with argv data (command, task, data, flags, etc.)
* **[#53](https://github.com/scottcorgan/nash/issues/53)** - Run tests on Travis instead of Codeship
* **[#54](https://github.com/scottcorgan/nash/issues/54)** - NEW: set values with an object
* **[#55](https://github.com/scottcorgan/nash/issues/55)** - BREAKING: plugins should just export a function

### Breaking Changes

There are quite a few breaking changes in this release. They are noted above. See the documentation for how upgrade your code.

* All commands, flags, befores, and afters are assumed async. All features that could be run in a synchronous way have been updated to use only the async mode. This creates consistency across the module and gives us one less thing to think about.
* Handlers on commands now receive 3 arguments always: `data`, `flags`, `done`. The `data` argument is an array of all the non-command and non-flag data from `process.argv`. The `flags` object is a key/value map of flags defined on the cli and used from `process.argv`. The `done` argument is the callback that must be called to pass execution back to the cli level.
* Several command and flag level methods have been removed. They are listed above.
* How plugins are registered and changed slightly. Instead of exporting a register function in the plugin, a plugin should now export a function.


* * *

(For releases previous to **2.0.0**, see [releases](https://github.com/scottcorgan/nash/releases))

