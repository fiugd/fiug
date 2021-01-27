import { attachListeners } from './events/operations.mjs';

import { managementOp } from './operationsManagement.mjs';
import { externalStateRequest } from './ExternalState.mjs';
import {
    setCurrentService,
    getCurrentFile, getCurrentService,
    getCurrentFolder, setCurrentFolder,
    getState, resetState
} from './state.mjs';
import {
    getOperations, getReadAfter, getUpdateAfter,
    performOperation, operationsListener
} from './operationsService.mjs'

async function Operations() {
    const {
		triggerOperationDone
	} = attachListeners({
        managementOp, externalStateRequest,
        getCurrentFile,
        getCurrentService, setCurrentService,
        getCurrentFolder, setCurrentFolder,
        getState, resetState,
        getOperations,
        getReadAfter, getUpdateAfter,
        performOperation, operationsListener
    });

    const lastService = localStorage.getItem('lastService');
    if(!lastService && ![0, "0"].includes(lastService)){
        console.warn('--- NO SERVICE SELECTED');
        const event = new CustomEvent('noServiceSelected', {
            bubbles: true,
            detail: {}
        });
        document.body.dispatchEvent(event);
        return;
    }

    // APPLICATION STATE BOOTSTRAP
    const operations = getOperations(
        () => {},
        (...args) => {
            const { result = {} } = args[0] || {};
            const services = result.result;

            //TODO: should really be firing a service read done event (or similar)
            const { filename: name } = setCurrentService(services[0]);
            const event = new CustomEvent('fileSelect', {
                bubbles: true,
                detail: { name }
            });
            document.body.dispatchEvent(event);
    });

    //const operations = getOperations(()=>{}, ()=>{});


    // TODO: this should go away at some point!!!
    // request a list of services from server (and determine if server is accessible)
    const foundOp = operations.find(x => x.name === 'read');
    //console.log({ foundOp });
    //await performOperation(foundOp, { body: { id: '' } }, externalStateRequest);

    //console.log({ lastService });
    const eventData = { body: { id: lastService } };
    const result = await performOperation(foundOp, { body: { id: lastService } }, externalStateRequest);
    triggerOperationDone(result);
}

export default Operations;