//import { registerPlugin } from 	'../src/plugins.ts';

import { WASocket } from "@whiskeysockets/baileys";


/*
registerPlugin(async sock => {
	sock.ev.on('messages.upsert', async ({ messages }) => {
		console.log(messages);
   });
});
*/



export default async (sock: WASocket) => {

	console.log("[*] Loading general plugin");

}
