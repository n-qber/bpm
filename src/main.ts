import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import P from "pino";


import NodeCache from "@cacheable/node-cache";
import makeWASocket, { Browsers, DisconnectReason, GroupMetadata, makeCacheableSignalKeyStore, type UserFacingSocketConfig } from "@whiskeysockets/baileys"
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
const groupCache = new NodeCache<GroupMetadata>();


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



async function main() {
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
	});

	sock.ev.on('creds.update', saveCreds);

	sock.ev.on('messages.upsert', ({ type, messages }) => {
		if(type == "notify")
		{
			console.log('got messages', messages);
		}
	});
}

main();
