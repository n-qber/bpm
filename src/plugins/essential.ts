import { WASocket } from "@whiskeysockets/baileys";
import { reloadPlugin } from "../plugins";

export default (sock: WASocket) => {


	sock.ev.on('messages.upsert', async ({ messages }) => {


		for(const message of messages)
		{
			const content = message.message?.extendedTextMessage?.text;
			if(content)
			{
				const [cmd, ...args] = content.split(" ");

				if(cmd == 'reload' && args[0])
				{
					reloadPlugin(sock, args[0]);
				}
			}
		}


	})
}
