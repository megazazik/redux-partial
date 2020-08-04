import { expectType, expectError } from 'tsd';
import { createStore, AnyAction, Store } from 'redux';
import { makePartial, PartialStore } from '..';

interface ITestState {
	f1: { value: string };
	f2: string;
	f3: number;
	f4: {
		v1: boolean;
		v2: { value: number; value2: number };
	};
}

const reducer = (state: ITestState, _: AnyAction) => state;

const store = createStore(reducer);

expectType<PartialStore<{ value: string }, AnyAction>>(
	makePartial(store).getPartial('f1')
);

expectType<PartialStore<{ value: number; value2: number }, AnyAction>>(
	makePartial(store).getPartial('f4', { select: (s) => s.v2 })
);

expectType<PartialStore<{ f1: { value: string }; f2: string }, AnyAction>>(
	makePartial(store).getPartial({ f1: true, f2: true })
);

const nestedStore = makePartial(store)
	.getPartial({ f1: true, f2: true })
	.getPartial({ f1: { value: true } });

expectType<PartialStore<{ f1: { value: string } }, AnyAction>>(nestedStore);

const innerFieldsStore = makePartial(store).getPartial({
	f1: true,
	f4: { v2: { value2: true } },
});

expectType<
	PartialStore<
		{ f1: { value: string }; f4: { v2: { value2: number } } },
		AnyAction
	>
>(innerFieldsStore);

const innerFieldsStore2 = makePartial(store).getPartial(
	{
		f1: true,
		f4: { v2: { value2: true } },
	},
	{ select: (s) => ({ f1v: s.f1.value, f4v2: s.f4.v2.value2 }) }
);

expectType<PartialStore<{ f1v: string; f4v2: number }, AnyAction>>(
	innerFieldsStore2
);

expectType<never>(
	makePartial(store).getPartial({ f5: true, f1: true }).getState().f5
);

/** @todo nested patrial type */

// Errors

expectError(makePartial(store).getPartial('f-not-exist'));
