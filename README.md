# redux-partial

[![npm version](https://badge.fury.io/js/redux-partial.svg)](https://badge.fury.io/js/redux-partial)

Library to work with a part of `redux` store as if it is a full-fledged store. You can subscribe to changes of a part of the state get access only to a part. All state change listeners will be invoked only if a particular part ot the state is changed. So it can highly improve performance of an application where there are many connected components.

-   [Make a store partial](#make-a-store-partial)
-   [Work with a part of the state](#work-with-a-part-of-the-state)

## Make a store partial

To work with a partial state you should use the `makePartial` method. It receive an origin `redux` store and return a store with the `getPartial` method.

```typescript
import { createStore } from 'redux';
import { makePartial } from 'redux-partial';
import { createAssistantMiddleware } from 'reducer-assistant/redux';

const originalStore = createStore(/** parameters */);

const store = makePartial(originalStore);
```

To access to a partial store which contains only one field of the original store you should pass a field name to the `getPartial` method.

```typescript
// Consider a store contains a field with name `user`
const userFieldStore = store.getPartial('user');
```

Now you can work with the `userFieldStore` as if it is a `redux` store which contains only data of a user.

You can use an object to select fields of the original state. Consider, an original state containes this data:

```typescript
interface State {
	user: {
		name: string;
		email: string;
	};
	order: {
		items: OrderItem[];
		status: OrderStatus;
	};
}
```

You can get a partial store which contains only this part of data:

```typescript
interface State {
	user: {
		email: string;
	};
	order: {
		status: OrderStatus;
	};
}
```

You should use this code to do that:

```typescript
const partialStore = store.getPartial({
	user: { email: true },
	order: { status: true },
});
```

You can use a `select` parameter if you want to convert a data of the partial store to some other shape.

```typescript
const partialStore = store.getPartial(
	{
		user: { email: true },
		order: { status: true },
	},
	{
		select: (state) => ({
			email: state.user.email,
			status: state.order.status,
		}),
	}
);
```

Now the partial store contains this type of data:

```typescript
interface PartialState {
	email: string;
	status: OrderStatus;
}
```

You can use the `reselect` library to cache a result of the selector if you need it.

## Work with a part of the state

A partial state contains all common methods of the `redux` store: `getState`, `subscribe` and `dispatch`, and also contains the `getPartial` method.
