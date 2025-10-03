import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import P from "pino";
import { initPlugins } from './plugins';


import NodeCache from "@cacheable/node-cache";
import makeWASocket, { Browsers, DisconnectReason, GroupMetadata, makeCacheableSignalKeyStore, type UserFacingSocketConfig } from "@whiskeysockets/baileys"
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
const groupCache = new NodeCache<GroupMetadata>();

async function main() {

	const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
	const waSocketOptions: UserFacingSocketConfig = {
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys)
		},
		browser: Browsers.windows("Desktop"),
		markOnlineOnConnect: false,
		cachedGroupMetadata: async jid => groupCache.get(jid),
		logger: P()
	}



	const sock = makeWASocket(waSocketOptions);
	sock.ev.on('connection.update', async update => {
		const { connection, lastDisconnect, qr } = update

		if (connection === 'close' && (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.restartRequired) {
			// create a new socket, this socket is now useless
			return await main();
		}

		if(qr)
		{
			console.log(await QRCode.toString(qr, { type: 'terminal' }));
		}

		// Ready state
		if(connection == 'open')
		{
			// load plugins here
			/*
				* plugins should receive sock object to handle it however they want
				* or register for events (a decision to be made)
				* it's more secure to just register for the events, but harder to implement (maybe)
				* the only issue i see is if the plugin needs to run code before an event happens
				* in this case, tho, they may be able to register for ready event? i can generate one
			*/

			// let's go with the event registering (i'm using typescript so that's better)

			// i ignored all of that and used the default (pass socket through function and trust plugins)
			// for the simple reason that the socket object would need a reference anyways
			// and abstracting wrapper functions for every action would
			// require me to update the whole plugin system and consider security
			// every single time
			console.log('[*] BPM: initPlugins()')
			await initPlugins(sock);
		}
	});


	sock.ev.on('creds.update', saveCreds);
}

main();
