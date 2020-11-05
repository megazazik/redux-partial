import { Store, Action } from 'redux';

type StoreWithMandatoryMethods<S, A extends Action> = Pick<
	Store<S, A>,
	'dispatch' | 'getState' | 'subscribe'
>;

type StateOfStore<TStore> = TStore extends StoreWithMandatoryMethods<
	infer S,
	any
>
	? S
	: never;
type ActionsOfStore<TStore> = TStore extends StoreWithMandatoryMethods<
	any,
	infer S
>
	? S
	: never;

export type StoreWithGetPartial<TStore> = TStore & {
	getPartial: GetPartial<StateOfStore<TStore>, ActionsOfStore<TStore>>;
};

export type FieldConfig<S> = { [K in keyof S]?: true | FieldConfig<S[K]> };

export type PartialState<S, Keys extends FieldConfig<S>> = {
	[K in keyof Keys]: Keys[K] extends true
		? K extends keyof S
			? S[K]
			: never
		: Keys[K] extends FieldConfig<K extends keyof S ? S[K] : never>
		? PartialState<K extends keyof S ? S[K] : never, Keys[K]>
		: never;
};

export type PartialStore<S, A extends Action> = StoreWithGetPartial<
	StoreWithMandatoryMethods<S, A>
>;

export type GetPartialParams<S, T> = {
	select: (state: S) => T;
};

export type GetPartial<S, A extends Action> = {
	<K extends keyof S>(key: K): PartialStore<S[K], A>;
	<K extends keyof S, T = S[K]>(
		key: K,
		params: GetPartialParams<S[K], T>
	): PartialStore<T, A>;
	<Keys extends FieldConfig<S>>(keys: Keys): PartialStore<
		PartialState<S, Keys>,
		A
	>;
	<Keys extends FieldConfig<S>, T = PartialState<S, Keys>>(
		keys: Keys,
		params: GetPartialParams<PartialState<S, Keys>, T>
	): PartialStore<T, A>;
};

export function makePartial<TStore extends StoreWithMandatoryMethods<any, any>>(
	store: TStore
): StoreWithGetPartial<TStore> {
	let prevFullState: any = store.getState();

	const listenerConfigs: Record<
		string,
		{ listeners: Array<() => void>; select: (s: any) => any }
	> = {};
	let unsubscribe: () => void;

	const onStateChangeListener = () => {
		const newState = store.getState();

		const listeners = ([] as Array<() => void>)
			.concat(
				...Object.values(listenerConfigs).map(
					({ select, listeners }) => {
						if (select(newState) === select(prevFullState)) {
							return [];
						}

						return listeners;
					}
				)
			)
			.filter(
				(listener, index, listeners) =>
					listeners.indexOf(listener) === index
			);

		prevFullState = newState;

		listeners.forEach((listener) => listener());
	};

	return {
		...store,
		getPartial(
			paramKeys: string | object,
			{ select = (s: any) => s } = {}
		) {
			const keys: Record<string, (s: any) => any> = {};
			let selectPartialState: (s: any) => any;

			if (typeof paramKeys === 'string') {
				keys[paramKeys] = (s) => s[paramKeys];
				selectPartialState = (s) => select(keys[paramKeys](s));
			} else {
				const fields = getFields(paramKeys);
				fields.forEach((ff) => {
					keys[ff.join('.')] = (s) => ff.reduce((s, f) => s[f], s);
				});
				selectPartialState = (s) =>
					select(
						fields.reduce((prev, ff) => {
							let value: any = s;
							let obj: any = prev;
							let field: string = ff[0];
							// create field
							ff.forEach((f, i) => {
								value = value[f];
								field = f;
								if (i !== ff.length - 1) {
									if (!obj[f]) {
										obj[f] = {};
									}
									obj = obj[f];
								}
							});

							obj[field] = value;

							return prev;
						}, {})
					);
			}

			let prevState: any;
			let prevStateFields: any[] = [];

			return makePartial({
				dispatch: store.dispatch,
				getState: () => {
					const newState = store.getState();
					const stateFields = Object.values(keys).map((select) =>
						select(newState)
					);

					if (
						stateFields.length !== prevStateFields.length ||
						stateFields.some(
							(currentFieldValue, index) =>
								currentFieldValue !== prevStateFields[index]
						)
					) {
						prevStateFields = stateFields;
						prevState = selectPartialState(newState);
					}

					return prevState;
				},
				subscribe: (paramListener: () => void) => {
					if (!Object.keys(listenerConfigs).length) {
						prevFullState = store.getState();
						unsubscribe = store.subscribe(onStateChangeListener);
					}

					const newListener = () => {
						paramListener();
					};
					Object.entries(keys).forEach(([key, selectField]) => {
						if (!listenerConfigs[key]) {
							listenerConfigs[key] = {
								listeners: [],
								select: selectField,
							};
						}

						listenerConfigs[key].listeners.push(newListener);
					});
					return () => {
						Object.keys(keys).forEach((key) => {
							const i = listenerConfigs[key].listeners.indexOf(
								newListener
							);
							if (i !== -1) {
								listenerConfigs[key].listeners.splice(i, 1);
							}

							if (listenerConfigs[key].listeners.length === 0) {
								delete listenerConfigs[key];
							}
						});

						if (Object.keys(listenerConfigs).length === 0) {
							unsubscribe();
						}
					};
				},
			});
		},
	};
}

function getFields(params: object): string[][] {
	const res: string[][] = [];
	Object.entries(params).forEach(([key, value]) => {
		if (value === true) {
			res.push([key]);
		} else {
			getFields(value).forEach((fields) => {
				res.push([key, ...fields]);
			});
		}
	});
	return res;
}
