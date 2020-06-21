import React, { Fragment, useState, useCallback, forwardRef } from 'react';
import { ListProvider, useList } from 'react-list-provider';
import assert from 'tiny-invariant';

// From https://github.com/react-hook-form/react-hook-form/blob/903e0cd309b8a5d19ce77fc3ab86e3992b08c7f2/src/utils/isDetached.ts
// Walk the tree to make sure this element is still valid
const isDetached = (element) => {
  if (!element) {
    return true;
  }

  if (
    !(element instanceof HTMLElement) ||
    element.nodeType === Node.DOCUMENT_NODE
  ) {
    return false;
  }

  return isDetached(element.parentNode);
};

const deriveName = (name) => `_checkem_${name}`;

export const CheckemProvider = ({ name, ...props }) => (
  <ListProvider {...props} keyBy="ref" name={deriveName(name)} />
);

export const useCheckem = ({ name }) => {
  const { addItem, removeItem, removeItems, hasItem, items } = useList({
    name: deriveName(name),
  });
  const [selectAllItem, setSelectAllItem] = useState();

  const garbageCollection = useCallback(() => {
    const detachedItems = items.filter(({ ref }) => !isDetached(ref));
    if (detachedItems.length) {
      removeItems(detachedItems.map(({ ref }) => ref));
    }
  }, [items, removeItems]);

  const toggleSelectAll = useCallback(
    (itemsToCheck) => {
      if (!selectAllItem) {
        return;
      }

      const mountedItems = itemsToCheck.filter(
        ({ ref }) => !isDetached(ref) && ref !== selectAllItem
      );

      const checkedItems = mountedItems.filter(({ ref }) => ref.checked);

      if (mountedItems.length === checkedItems.length) {
        // All checked
        selectAllItem.checked = true;
        selectAllItem.indeterminate = false;
      } else if (checkedItems.length !== 0) {
        // Some checked
        selectAllItem.checked = true;
        selectAllItem.indeterminate = true;
      } else {
        // None checked
        selectAllItem.checked = false;
        selectAllItem.indeterminate = false;
      }
    },
    [selectAllItem]
  );

  const register = useCallback(
    (ref) => {
      if (ref && !hasItem(ref)) {
        addItem({ ref });
        toggleSelectAll([...items, { ref }]);
      }
    },
    [addItem, hasItem, removeItem]
  );

  const registerSelectAll = useCallback(
    (ref) => {
      register(ref);
      setSelectAllItem(ref);
    },
    [register, setSelectAllItem]
  );

  const handleChangeSelectAll = useCallback(
    (target) => {
      if (target !== selectAllItem) {
        console.error('selectAllItem does not match target of event.');
        return;
      }

      const mountedItems = items.filter(
        ({ ref }) => !isDetached(ref) && ref !== selectAllItem
      );

      const checked = !!selectAllItem.checked;

      const itemsToChange = mountedItems.filter(
        ({ ref }) => ref.checked !== checked
      );

      itemsToChange.forEach(({ ref }) => {
        // Apparently the spec says that checkboxes should not  listen to
        // dispatched "change" events, so all we can do is ".click()" it.
        // But I'm not convinced browsers wont cancel this thinking it's a spam
        // thing, so I'm also forcing the `ref.checked` value after the event is
        // fired
        ref.click();
        ref.checked = checked;
      });

      // Do some garbage collection
      garbageCollection();
    },
    [items, selectAllItem, garbageCollection]
  );

  const handleChangeItem = useCallback(
    (target) => {
      if (!hasItem(target)) {
        console.warn(
          'Not handling checkbox change event for unregistered element.'
        );
        return;
      }

      toggleSelectAll(items);

      // Do some garbage collection
      garbageCollection();
    },
    [items, removeItems, garbageCollection]
  );

  const handleChange = useCallback(
    (event) => {
      if (selectAllItem === event.target) {
        handleChangeSelectAll(event.target);
      } else {
        handleChangeItem(event.target);
      }
    },
    [selectAllItem, handleChangeSelectAll, handleChangeItem]
  );

  return {
    register,
    registerSelectAll,
    handleChange,
  };
};

export const CheckemConsumer = ({ name, children }) => {
  assert(
    !!name,
    'The react-checkem#<CheckemConsumer> component requires a `name`.'
  );

  const checkem = useCheckem({ name });
  return <Fragment>{children(checkem)}</Fragment>;
};

export const withCheckem = (Comp, { name } = {}) => {
  assert(
    !!name,
    'The react-checkem#withCheckem() HOC requires a `name` config passed as the second argument.'
  );

  return forwardRef((props, ref) => {
    const checkem = useCheckem({ name });
    return <Comp checkem={checkem} {...props} ref={ref} />;
  });
};
