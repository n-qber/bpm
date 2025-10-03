import { WASocket } from "@whiskeysockets/baileys";

export default async (sock: WASocket) => {

	console.log("[*] General: main()");

	sock.ev.on('messages.upsert', async ({ messages }) => {


		for(const message of messages)
		{
			const content = message.message?.extendedTextMessage?.text;
			if(content)
			{
				const [cmd, ...args] = content.split(" ");


				if(cmd == 'clean')
				{
					console.clear();
					console.log('\x1b[2J'); // linux
					// I will remove this
				}
			}
		}


	});

}
