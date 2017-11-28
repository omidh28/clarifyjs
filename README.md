# clarifyJs

ClarifyJs allows you to easily create chained methods that can be executed in any order you want.

This feature is particularly useful when you want to make your code more friendly and declarative, For Example we have these chained methods for sending a message to a specific group of users:
```javascript
send('hello everyone!').to('friends');
```
This works fine with normal method chaining but what about when we want to create more complex chained methods?
For example we want to filter some of our friends out:
```javascript
send('hello everyone!').to('friends').except('john');
```
Normal javascript methods are executed from left-to-right, So when we reach "except" filter the message has already been sent to all friends. However ClarifyJs allows to overcome this limitation by allowing to priorities methods to allow execution in any order.

ClarifyJs also allows controlling async methods. Suppose we want to log a message to console when the message has been sent:
```javascript
send('hello everyone!').to('friends').then.log('message has been sent.');
```
The problem is that if "send" method is a async method then the log message will be printed before the message is actually sent. ClarifyJs allows to decide whether the process should wait for a specific async method to complete before moving on or just execute and pass by it.

These features come in price of making the whole process async.

---

## Installation

In a browser:
```html
<script src="clarify.js"></script>
```

Using npm:
```shell
$ npm i --save clarifyjs
```

---

## Usage
First the methods routes must be defined.

**Syntax:**
```javascript
// Array of routes objects
const routesData = [ ...];
const root = clarify({ routes: routesData });
```

### Routes

Routes are objects that have at least the two property **handler** and **path**.

| Property        | Type           | Default Value | Description  |
| :-------------: | :-------------: | :-----: | :-----: |
| path| String | None | The address of the method, Root address is empty string. Wildcard can be used.
| handler | Function | None | The method function.
| storeResultAs | String | Empty String | Store method's result with this name.
| inject | String/Array | Empty Array | Name of the stored results to pass to the method handler
| controller | String | () | "()" if the method should be called with paranthesis otherwise "[]"
| awaitForHandler | Boolean | False | Whether the process should wait for the method handler to complete or not.
| Priority | Number | -Infinity | Priority of the method execution, Higher priority methods will be executed before others.

### Example
Demonstration of the example explained above:
```javascript
const routesData = [
	{
		path: '',
		handler: sendMessageFunc,
		inject: ['contacts'],
  		awaitForHandler: true,
		priority: 0
	},
	{
		path: 'to',
		handler: contactSelectorFunc,
		storeResultAs: 'contacts',
		priority: 2
	},
        {
		path: 'to.except',
		handler: contactFilterFunc,
		inject: ['contacts'],
		storeResultAs: 'contacts',
		priority: 1
	},
	{
		path: 'to.except.then.log',
		handler: logFunc,
		priority: -Infinity
	}
];

const send = clarify({ routes: routesData });
send('hello everyone!').to('friends').then.log('message has been sent!');
```

[![Travis build status](http://img.shields.io/travis/omidh28/clarifyJs.svg?style=flat)](https://travis-ci.org/omidh28/clarifyJs)
[![Maintainability](https://api.codeclimate.com/v1/badges/f76a9e87744ce4283c42/maintainability)](https://codeclimate.com/github/omidh28/clarifyjs/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/f76a9e87744ce4283c42/test_coverage)](https://codeclimate.com/github/omidh28/clarifyjs/test_coverage)
[![Dependency Status](https://david-dm.org/omidh28/clarifyJs.svg)](https://david-dm.org/omidh28/clarifyJs)
[![devDependency Status](https://david-dm.org/omidh28/clarifyJs/dev-status.svg)](https://david-dm.org/omidh28/clarifyJs#info=devDependencies)
