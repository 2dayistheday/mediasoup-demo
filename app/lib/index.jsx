import domready from 'domready';
import UrlParse from 'url-parse';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import {
	applyMiddleware as applyFluxMiddleware,
	createStore as createFluxStore
} from 'redux';
import thunk from 'redux-thunk';
import { createLogger as createReduxLogger } from 'redux-logger';
import { getDeviceInfo } from 'mediasoup-client';
import randomString from 'random-string';
import randomName from 'node-random-name';
import Logger from './Logger';
import * as utils from './utils';
import * as cookiesManager from './cookiesManager';
import * as requestActions from './flux/requestActions';
import * as stateActions from './flux/stateActions';
import reducers from './flux/reducers';
import roomClientMiddleware from './flux/roomClientMiddleware';
import Room from './components/Room';

const REGEXP_FRAGMENT_ROOM_ID = new RegExp('^#roomId=([0-9a-zA-Z_-]+)$');

const logger = new Logger();
const reduxMiddlewares =
[
	thunk,
	roomClientMiddleware
];

if (process.env.NODE_ENV === 'development')
{
	const fluxLogger = createReduxLogger(
		{
			duration  : true,
			timestamp : false,
			level     : 'log',
			logErrors : true
		});

	reduxMiddlewares.push(fluxLogger);
}

const store = createFluxStore(
	reducers,
	undefined,
	applyFluxMiddleware(...reduxMiddlewares)
);

domready(() =>
{
	logger.debug('DOM ready');

	// Load stuff and run
	utils.initialize()
		.then(run);
});

function run()
{
	logger.debug('run() [environment:%s]', process.env.NODE_ENV);

	const peerName = randomString({ length: 8 }).toLowerCase();
	const urlParser = new UrlParse(window.location.href, true);
	const match = urlParser.hash.match(REGEXP_FRAGMENT_ROOM_ID);
	let roomId;

	if (match)
	{
		roomId = match[1];
	}
	else
	{
		roomId = randomString({ length: 8 }).toLowerCase();
		window.location = `#roomId=${roomId}`;
	}

	// Get displayName from cookie.
	const userCookie = cookiesManager.getUser() || {};
	let displayName;
	let displayNameSet;

	if (userCookie.displayName)
	{
		displayName = userCookie.displayName;
		displayNameSet = true;
	}
	else
	{
		displayName = randomName();
		displayNameSet = false;
	}

	// Get current device.
	const device = getDeviceInfo();

	// NOTE: I don't like this.
	store.dispatch(
		stateActions.setMe({ peerName, displayName, displayNameSet, device }));

	// NOTE: I don't like this.
	store.dispatch(
		requestActions.joinRoom({ roomId, peerName, displayName, device }));

	render(
		<Provider store={store}>
			<Room />
		</Provider>,
		document.getElementById('mediasoup-demo-app-container')
	);
}

// TODO: Debugging stuff.

global.sendSdp = function()
{
	logger.debug('---------- SEND_TRANSPORT LOCAL SDP OFFER:');
	logger.debug(
		global.CLIENT._sendTransport._handler._pc.localDescription.sdp);

	logger.debug('---------- SEND_TRANSPORT REMOTE SDP ANSWER:');
	logger.debug(
		global.CLIENT._sendTransport._handler._pc.remoteDescription.sdp);
};

global.recvSdp = function()
{
	logger.debug('---------- RECV_TRANSPORT REMOTE SDP OFFER:');
	logger.debug(
		global.CLIENT._recvTransport._handler._pc.remoteDescription.sdp);

	logger.debug('---------- RECV_TRANSPORT LOCAL SDP ANSWER:');
	logger.debug(
		global.CLIENT._recvTransport._handler._pc.localDescription.sdp);
};
