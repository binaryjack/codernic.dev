import type { SagaIterator } from 'redux-saga';
import { put, call } from 'redux-saga/effects';
import { openModal, closeModal, type ModalConfig } from './modal.slice';

/**
 * Dispatcher Promise Modal Saga Helper
 * 
 * Generates a native Promise, dispatches the 'modal/open' action carrying the resolve/reject 
 * callbacks in its meta property, and pauses the calling Saga until the Promise resolves.
 */
export function* dispatchPromiseModal(config: ModalConfig): SagaIterator {
    let resolveFn: (value: any) => void = () => {};
    let rejectFn: (reason: any) => void = () => {};
    
    const promise = new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
    });

    // Dispatch the action with the UI payload and the deferred meta property
    yield put(openModal(config, { resolve: resolveFn, reject: rejectFn }));

    try {
        // The Saga natively pauses here until the UI calls resolve()
        const result = yield promise;
        return result;
    } catch (error) {
        throw error;
    } finally {
        // Clean up modal state automatically
        yield put(closeModal());
    }
}
