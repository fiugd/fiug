<!-- no-select -->
- [mvc family tree](https://mvc.givan.se/)


```xml
<!-- the shape of the data -->
<script type="model">
  // does react ecosystem have anything like this?
</script>
```

```xml
<!-- the way a user interacts with data -->
<script type="controller">
  // flux/redux store?
</script>
```

```xml
<!-- the way the data is presented -->
<script type="view">
  <style>
  </style>

  const App = () => {
    //binding to the store...
    const [ value, method ] = Store();

    return (
      <div>
        <a onClick={}>{value}</a>
      </div>
    );
  };

  // how does this view (App) get connected?
  // render(<App />); //right?
</script>
```


------------------------------------------------------------------------


How are these bound together?

How are these combined with each other?



## Model:

a store usually handles model storage an manipulation
but often application and external logic show up in a store

also a store/framework handles how models are bound together

flux/redux wants to abandon the model in favor of composing actions?



## View

this should be updated from the store and present a visual/html/css
but often "extras" show up, see containers & lifecycle methods

also views handle how store/models are bound to some degree
also views handle things like making network calls and routing state



## Controller

this should handle user input and change state/model
flux/redux stores typically do this, but react views can do the same

should controllers make network requests?
how should controllers be composed?
