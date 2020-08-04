import tape from 'tape';
import { createStore } from 'redux';
import { spy } from 'sinon';
import { makePartial } from '..';

interface ITestState {
	f1: { value: string };
	f2: string;
	f3: number;
	f4: {
		v1: boolean;
		v2: { value: number; value2: number };
	};
}

const setState = (state: ITestState) => ({
	type: 'setState',
	payload: state,
});

const reducer = (state: ITestState, action: ReturnType<typeof setState>) =>
	action.type === 'setState' ? action.payload : state;

const getStore = () => {
	const originalStore = createStore(reducer, {
		f1: { value: 'f1Value' },
		f2: 'f2string',
		f3: 12,
		f4: {
			v1: true,
			v2: { value: 21, value2: 65 },
		},
	});

	return makePartial(originalStore);
};

tape('Partial state. Subscrube field', (t) => {
	const onF1Changed = spy();
	const onF2Changed = spy();

	const store = getStore();

	store.getPartial('f1').subscribe(onF1Changed);
	store.getPartial('f2').subscribe(onF2Changed);

	t.ok(onF1Changed.notCalled);
	t.ok(onF2Changed.notCalled);

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new' },
		})
	);

	t.ok(onF1Changed.calledOnce);
	t.ok(onF2Changed.notCalled);

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'newF2',
		})
	);

	t.ok(onF1Changed.calledOnce);
	t.ok(onF2Changed.calledOnce);

	t.end();
});

tape('Partial state. Subscrube field. Unsubscribe', (t) => {
	const onF1Changed = spy();
	const onF2Changed = spy();

	const store = getStore();

	const unsubscribe1 = store.getPartial('f1').subscribe(onF1Changed);
	const unsubscribe2 = store.getPartial('f2').subscribe(onF2Changed);

	unsubscribe1();

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new' },
		})
	);

	t.ok(onF1Changed.notCalled);

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'newF2',
		})
	);

	t.ok(onF2Changed.calledOnce);

	unsubscribe2();

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'newF3',
		})
	);

	t.ok(onF2Changed.calledOnce);

	t.end();
});

tape('Partial state. Subscribe field by object', (t) => {
	const onF1ValueChanged = spy();
	const onF4v2v2Changed = spy();

	const store = getStore();

	store.getPartial({ f1: { value: true } }).subscribe(onF1ValueChanged);
	store
		.getPartial({ f4: { v2: { value2: true } } })
		.subscribe(onF4v2v2Changed);

	t.ok(onF1ValueChanged.notCalled);
	t.ok(onF4v2v2Changed.notCalled);

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: store.getState().f1.value },
		})
	);

	t.ok(onF1ValueChanged.notCalled);
	t.ok(onF4v2v2Changed.notCalled);

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'newF1Va;ie' },
		})
	);

	t.ok(onF1ValueChanged.calledOnce);
	t.ok(onF4v2v2Changed.notCalled);

	store.dispatch(
		setState({
			...store.getState(),
			f4: {
				...store.getState().f4,
				v2: { value: 99, value2: store.getState().f4.v2.value2 },
			},
		})
	);

	t.ok(onF1ValueChanged.calledOnce);
	t.ok(onF4v2v2Changed.notCalled);

	store.dispatch(
		setState({
			...store.getState(),
			f4: {
				...store.getState().f4,
				v2: { value2: 88, value: store.getState().f4.v2.value },
			},
		})
	);

	t.ok(onF1ValueChanged.calledOnce);
	t.ok(onF4v2v2Changed.calledOnce);

	t.end();
});

tape('Partial state. Subscribe field by object. Unsubscribe', (t) => {
	const onF1ValueChanged = spy();
	const onF4v2v2Changed = spy();

	const store = getStore();

	const unsubscribe1 = store
		.getPartial({ f1: { value: true } })
		.subscribe(onF1ValueChanged);
	const unsubscribe2 = store
		.getPartial({ f4: { v2: { value2: true } } })
		.subscribe(onF4v2v2Changed);

	unsubscribe1();

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-val' },
		})
	);

	t.ok(onF1ValueChanged.notCalled);
	t.ok(onF4v2v2Changed.notCalled);

	store.dispatch(
		setState({
			...store.getState(),
			f4: {
				...store.getState().f4,
				v2: { value2: 88, value: store.getState().f4.v2.value },
			},
		})
	);

	t.ok(onF4v2v2Changed.calledOnce);

	unsubscribe2();

	store.dispatch(
		setState({
			...store.getState(),
			f4: {
				...store.getState().f4,
				v2: { value2: 77, value: store.getState().f4.v2.value },
			},
		})
	);

	t.ok(onF4v2v2Changed.calledOnce);

	t.end();
});

tape('Partial state. Subscribe different listeners same field', (t) => {
	const onF1ValueChanged1 = spy();
	const onF1ValueChanged2 = spy();
	const onF1ValueChanged3 = spy();

	const store = getStore();

	store.getPartial({ f1: { value: true } }).subscribe(onF1ValueChanged1);

	const f1ValueStore = store.getPartial({ f1: { value: true } });

	const unsubscribe2 = f1ValueStore.subscribe(onF1ValueChanged2);
	const unsubscribe3 = f1ValueStore.subscribe(onF1ValueChanged3);

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-val1' },
		})
	);

	t.ok(onF1ValueChanged1.calledOnce);
	t.ok(onF1ValueChanged2.calledOnce);
	t.ok(onF1ValueChanged3.calledOnce);

	unsubscribe2();

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-val2' },
		})
	);

	t.ok(onF1ValueChanged1.calledTwice);
	t.ok(onF1ValueChanged2.calledOnce);
	t.ok(onF1ValueChanged3.calledTwice);

	unsubscribe3();

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-val3' },
		})
	);

	t.ok(onF1ValueChanged1.calledThrice);
	t.ok(onF1ValueChanged2.calledOnce);
	t.ok(onF1ValueChanged3.calledTwice);

	t.end();
});

tape('Partial state. Subscribe same listener several times', (t) => {
	const onChanged = spy();

	const store = getStore();

	store.getPartial({ f1: { value: true } }).subscribe(onChanged);

	const f1ValueStore = store.getPartial({ f2: true });

	const unsubscribe2 = f1ValueStore.subscribe(onChanged);
	const unsubscribe3 = f1ValueStore.subscribe(onChanged);

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-val1' },
		})
	);

	t.ok(onChanged.calledOnce);

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'new-f2-1',
		})
	);

	t.equal(onChanged.callCount, 3);

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'new-f2-1',
		})
	);

	t.equal(onChanged.callCount, 3);

	unsubscribe2();

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'new-f2-2',
		})
	);

	t.equal(onChanged.callCount, 4);

	unsubscribe3();

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'new-f2-3',
		})
	);

	t.equal(onChanged.callCount, 4);

	t.end();
});

tape('Partial state. Subscribe several fields at once', (t) => {
	const onChanged = spy();

	const store = getStore();

	const unsubscribe = store
		.getPartial({ f1: { value: true }, f2: true })
		.subscribe(onChanged);

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-val1' },
		})
	);

	t.ok(onChanged.calledOnce);

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'new-f2-1',
		})
	);

	t.equal(onChanged.callCount, 2);

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-val2' },
			f2: 'new-f2-2',
		})
	);

	t.equal(onChanged.callCount, 3);

	unsubscribe();

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-val3' },
		})
	);

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'new-f2-3',
		})
	);

	t.equal(onChanged.callCount, 3);

	t.end();
});

tape('Partial state. Get state', (t) => {
	const store = getStore();

	t.equal(store.getPartial('f3').getState(), store.getState().f3);

	t.deepEqual(store.getPartial({ f1: { value: true } }).getState(), {
		f1: { value: store.getState().f1.value },
	});

	t.deepEqual(store.getPartial({ f4: true }).getState(), {
		f4: store.getState().f4,
	});

	t.deepEqual(
		store
			.getPartial({
				f4: { v2: { value2: true, value: true }, v1: true },
				f2: true,
			})
			.getState(),
		{
			f4: {
				v2: {
					value2: store.getState().f4.v2.value2,
					value: store.getState().f4.v2.value,
				},
				v1: store.getState().f4.v1,
			},
			f2: store.getState().f2,
		}
	);

	t.end();
});

tape(
	'Partial state. Get state. Return same state when data has not been changed. String',
	(t) => {
		const store = getStore();

		let prev = store.getPartial('f3').getState();
		t.equal(store.getPartial('f3').getState(), prev);

		store.dispatch(
			setState({
				...store.getState(),
				f3: store.getState().f3,
			})
		);

		t.equal(store.getPartial('f3').getState(), prev);

		store.dispatch(
			setState({
				...store.getState(),
				f3: 987,
			})
		);

		t.notEqual(store.getPartial('f3').getState(), prev);

		t.end();
	}
);

tape(
	'Partial state. Get state. Return same state when data has not been changed. Object',
	(t) => {
		const store = getStore();
		const partial = store.getPartial({
			f4: { v2: { value2: true }, v1: true },
			f2: true,
		});

		let prev = partial.getState();
		t.equal(partial.getState(), prev);

		store.dispatch(
			setState({
				...store.getState(),
				f3: 739,
			})
		);

		t.equal(partial.getState(), prev);

		store.dispatch(
			setState({
				...store.getState(),
				f4: {
					...store.getState().f4,
					v2: {
						...store.getState().f4.v2,
						value: 363,
					},
				},
			})
		);

		t.equal(partial.getState(), prev);

		store.dispatch(
			setState({
				...store.getState(),
				f4: {
					...store.getState().f4,
					v2: {
						...store.getState().f4.v2,
						value2: 532,
					},
				},
			})
		);

		t.notEqual(partial.getState(), prev);

		prev = partial.getState();

		store.dispatch(
			setState({
				...store.getState(),
				f2: 'new-value-2',
			})
		);

		t.notEqual(partial.getState(), prev);

		t.end();
	}
);

tape('Partial state. Get state. Get new value into listener', (t) => {
	const store = getStore();

	let partial = store.getPartial({ f1: { value: true } });

	partial.getState();

	partial.subscribe(() => {
		t.equal(partial.getState().f1.value, 'new-f1-value');
		t.end();
	});

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-f1-value' },
		})
	);
});

tape('Partial state. Nested', (t) => {
	const store = getStore();

	let partial = store
		.getPartial({ f1: true })
		.getPartial({ f1: { value: true } });

	partial.getState();

	partial.subscribe(() => {
		t.equal(partial.getState().f1.value, 'new-f1-value');
		t.end();
	});

	store.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new-f1-value' },
		})
	);
});

tape('Partial state. Get state. With Select. String', (t) => {
	const store = getStore();

	const partial = store.getPartial('f3', { select: (s) => s + 1 });

	t.equal(partial.getState(), store.getState().f3 + 1);

	store.dispatch(
		setState({
			...store.getState(),
			f3: 111,
		})
	);

	t.equal(partial.getState(), 112);

	t.end();
});

tape('Partial state. Get state. With Select. Object', (t) => {
	const store = getStore();
	const partial = store.getPartial(
		{
			f4: { v2: { value2: true }, v1: true },
			f2: true,
		},
		{ select: (s) => ({ f2: s.f2, f4v1: s.f4.v1, f4v2: s.f4.v2.value2 }) }
	);

	let prev = partial.getState();
	t.deepEqual(prev, {
		f2: store.getState().f2,
		f4v1: store.getState().f4.v1,
		f4v2: store.getState().f4.v2.value2,
	});
	t.equal(partial.getState(), prev);

	store.dispatch(
		setState({
			...store.getState(),
			f3: 739,
		})
	);

	t.equal(partial.getState(), prev);

	store.dispatch(
		setState({
			...store.getState(),
			f4: {
				...store.getState().f4,
				v2: {
					...store.getState().f4.v2,
					value: 363,
				},
			},
		})
	);

	t.equal(partial.getState(), prev);

	store.dispatch(
		setState({
			...store.getState(),
			f4: {
				...store.getState().f4,
				v2: {
					...store.getState().f4.v2,
					value2: 532,
				},
			},
		})
	);

	t.notEqual(partial.getState(), prev);

	prev = partial.getState();

	store.dispatch(
		setState({
			...store.getState(),
			f2: 'new-value-2',
		})
	);

	t.notEqual(partial.getState(), prev);

	t.end();
});

tape('Partial state. Dispatch', (t) => {
	const onFullChanged = spy();
	const onPartChanged = spy();

	const store = getStore();

	store.subscribe(onFullChanged);

	const partial = store.getPartial('f1').getPartial('value');
	partial.subscribe(onPartChanged);

	t.ok(onFullChanged.notCalled);
	t.ok(onPartChanged.notCalled);

	partial.dispatch(
		setState({
			...store.getState(),
			f1: { value: 'new' },
		})
	);

	t.ok(onFullChanged.calledOnce);
	t.ok(onPartChanged.calledOnce);

	t.end();
});
