# TBTree #

A tree control for twitter bootstrap.

__WARNING__:This plugin is very much "alpha" and contains a number of hard-coded things that will change over time.  Use at your own risk!

## Dependencies ##

- Twitter Bootstrap
- jQuery
- underscore.js

## Usage ##

Assuming you have some data in a regular object literal structure:

```javascript
var books = {
  'Science Fiction': [
    {
      title: 'Dune',
      author: 'Frank Herbert',
      rating: '5/5'
    },
    {
      title: "Ender's Game",
      author: 'Orson Scott Card',
      rating: '5/5'
    }
  ]
}
```

and assuming you have some DOM element where you want your tree to appear:

```html
<div id="book-tree"></div>
```

the tree is initialized in code (probably in a jquery `ready()` callback) like this:

```javascript
var tree = tbtree('#book-tree').load(books);
```

The only event currently supported is 'selected', which may be subscribed to like this:

```javascript
tree.on('selected', function (e) {
  // where 'e' is a custom object
  // that will have some data related
  // to the list item that was selected
});
```

Of course, you can always subscribe to events via jQuery like normal:

```javascript
$('#book-tree').on('click', 'li', function (e) {
  // a list element was clicked
});
```

