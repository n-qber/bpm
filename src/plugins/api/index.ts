import { WASocket } from "@whiskeysockets/baileys";
import Fastify from 'fastify';
import { reloadAllPlugins, reloadPlugin } from "../../plugins";


const fastify = Fastify({ logger: true })


export async function clean(){
	await fastify.close()
}



export default async (sock: WASocket) => {

	console.log('[*] API: main()');


	fastify.get('/alive', async () => ({ status: 'alive' }))


	fastify.get('/loaded', async () => {
		const { default: { plugins } } = require('../../plugins/config');
		return { plugins }
	});

	fastify.get<{ Params: {plugin: string} }>('/reload/:plugin', async (request) => {
		try{
			const { plugin } = request.params;

			if(plugin)
			{
				await reloadPlugin(sock, plugin);
				return { status: 'ok' }
			}

			await reloadAllPlugins(sock)
			return { status: 'ok' }

		}catch(err){
			console.log('[!] API: error reloadin plugins')
			console.error(err);
			return { status: 'error', error: JSON.stringify(err) }
		}
	});

	try{
		await fastify.listen({ port: 3000 })
	}catch(err)
	{
		console.log('[!] API: Couldn\'t initialize fastify');
		console.error(err);
	}
}
