How to make the code debuggable with ES7 features: [here](https://www.juandebravo.com/2019/05/20/debug-node-babel-docker/); still stuck with node 10 inside the container though; I tried switching to node 12 but didn't work

Unit/integration tests with ES7 using mocha/chai: [here](https://dev.to/bnorbertjs/my-nodejs-setup-mocha--chai-babel7-es6-43ei), had to change a command line arg because it's being deprecated in the version of mocha I'm using

Test coverage: [here](https://www.npmjs.com/package/@istanbuljs/nyc-config-babel); the easiest part so far, hehehe!

Linting: [here](https://medium.com/the-node-js-collection/why-and-how-to-use-eslint-in-your-project-742d0bc61ed7) to lint with slint using strongloop's rules before running the tests and [here](https://eslint.org/docs/user-guide/configuring) to configure the parser's options (so it could lint ES6/7 modules) and [here](https://github.com/babel/babel-eslint/issues/312) to understand that I had to 'force' eslint to use the babel parser

Test debugging: started [here](https://github.com/microsoft/vscode-recipes/tree/master/debugging-mocha-tests), but the debugger's cursor always stops at the end of the function being called. Tried [this link], which was basically adding new property to the launch.json's configuration (sourceMaps: true); didn't work either.

Pagination/sorting with MongoDB: started [here](https://www.hacksparrow.com/databases/mongodb/pagination.html) for pagination

Field hiding: started [here](https://stackoverflow.com/questions/15020246/mongoose-js-except-id-v-from-query-result-by-default/15025570#15025570), but don't know if it will actually solve my problem without creating other(s)

Some bugs along the way worth some recognition: [here's](https://github.com/mochajs/mocha/issues/2407) the explanation of a bug that was making the tests fail; more precisely, mocha supports two types of async processing, but not both at the same time. In my case, the error message wasn't exactly obvious, and going by the thread in the link, I wasn't the only one either.