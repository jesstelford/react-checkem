# React Check 'em

> _Simple "Select All" for checkboxes in React_

```javascript
import { CheckemProvider, useCheckem } from 'react-checkem';

const App = () => (
  <CheckemProvider name="my-form">
    <Form />
  </CheckemProvider>
);

const Form = () => {
  const { register, registerSelectAll, handleChange } = useCheckem({
    name: 'my-form',
  });

  return (
    <form>
      <label>
        <input type="checkbox" ref={registerSelectAll} onChange={handleChange} />
        Select All
      </label>
      <label>
        <input type="checkbox" ref={register} onChange={handleChange} />
        Item 1
      </label>
      <label>
        <input type="checkbox" ref={register} onChange={handleChange} />
        Item 2
      </label>
      <label>
        <input type="checkbox" ref={register} onChange={handleChange} />
        Item 3
      </label>
    </form>
  );
};
```
