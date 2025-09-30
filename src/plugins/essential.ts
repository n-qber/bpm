import { WASocket } from "@whiskeysockets/baileys";
import { reloadPlugin, reloadAllPlugins } from "../plugins";

export default (sock: WASocket) => {


	console.log("[*] Loading essential");
	sock.ev.on('messages.upsert', async ({ messages }) => {


		for(const message of messages)
		{
			const content = message.message?.extendedTextMessage?.text;
			if(content)
			{
				const [cmd, ...args] = content.split(" ");

				if(cmd == 'reload' && args[0])
				{
					console.log(`[r] Reloading ${args[0]}`);
					reloadPlugin(sock, args[0]);
				}

				if(cmd == 'reload')
				{
					reloadAllPlugins(sock);
				}
			}
		}


	})
}
