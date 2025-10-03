import { BaileysEvent, BaileysEventMap, WASocket } from "@whiskeysockets/baileys";
type BaileysListener = (arg: BaileysEventMap[BaileysEvent]) => void;


// SOME THINGS IN THIS FILE REPRESENT HOW IT WOULD WORK BASED ON EXPORTING EVENTS
// BUT THAT IS NOT HOW IT WORKS


/*
	* every plugin should export functions that react to events
*/

export const pluginListeners: Record<string, Partial<Record<BaileysEvent, BaileysListener[]>>> = {}



// must be async maybe so loading doesnt block
type PluginModule = ((sock: WASocket) => Promise<void>);

async function loadPlugin(sock: WASocket, pluginName: string, oldOn: <T extends keyof BaileysEventMap>(event: T, listener: (arg: BaileysEventMap[T]) => void) => void)
{
	console.log(`\t[*] PlugManager: loadPlugin(${pluginName})`);
	sock.ev.on = (event, listener) => {
		if(!pluginListeners[pluginName])
			pluginListeners[pluginName] = {};

		if(!pluginListeners[pluginName][event])
			pluginListeners[pluginName][event] = [];

		pluginListeners[pluginName][event].push(listener as BaileysListener);
		return oldOn(event, listener);
	}

	// plugins must have a default export
	try{
		const plugin = require(`./plugins/${pluginName}`);
		await plugin.default(sock);
	}catch(err){
		// TODO error logging
		// CHANGE move this outside?
		console.error(err);
	}
}

async function cleanPlugin(sock: WASocket, pluginName: string)
{
	console.log(`[*] PlugManager: cleanPlugin(${pluginName})`);
	try{
		const plugin = require(`./plugins/${pluginName}`);
		if(plugin.clean)
		{
			console.log(`\t[*] PlugManager: ${pluginName}.clean()`);
			await plugin.clean();
		}
	}catch(err){
		// TODO error logging
		// CHANGE move this outside?
		console.log(`\t[!] PlugManager: error cleaning ${pluginName}`);
		console.error(err);
	}
}


async function reloadPlugin(sock: WASocket, pluginName: string)
{
	console.log(`\t[*] PlugManager: reloadPlugin(${pluginName})`);
	const oldOn = sock.ev.on;
	if(pluginListeners[pluginName])
	{
		for(const event of Object.keys(pluginListeners[pluginName]) as BaileysEvent[])
		{
			if(pluginListeners[pluginName][event])
			{
				for(const listener of pluginListeners[pluginName][event])
					sock.ev.off(event, listener);
			}else{
				delete pluginListeners[pluginName][event];
			}
		}
	}
	const modulePath = require.resolve(`./plugins/${pluginName}`);
	await cleanPlugin(sock, pluginName);
	delete require.cache[modulePath];
	await loadPlugin(sock, pluginName, oldOn);
	sock.ev.on = oldOn;
}

async function reloadAllPlugins(sock: WASocket)
{
	console.log('[*] PlugManager: reloadAllPlugins()');
	const configPath = require.resolve('./plugins/config');
	delete require.cache[configPath];
	const { default: { plugins } } = require('./plugins/config');

	for(const plugin of plugins)
	{
		try{
			console.log(`[*] Loading ${plugin}`);
			reloadPlugin(sock, plugin);
		}catch(err)
		{
			console.error(err);
			console.error(`[!] Could not reload plugin [${plugin}]`);
		}
	}
}

async function initPlugins(sock: WASocket)
{
	console.log('[*] PlugManager: initPlugins()')
	const oldOn = sock.ev.on;

	// TODO implement better error catching here
	try{
		const { default: { plugins } } = require('./plugins/config');

		// TODO prevent path traversal
		for(const plugin of plugins)
		{
			await loadPlugin(sock, plugin, oldOn);
		}
	}catch(err){
		console.error(err);
		console.error("[!] Could not load plugins");
	}

	sock.ev.on = oldOn;
}

export { initPlugins, reloadPlugin, reloadAllPlugins }

// CHANGE make a wrapper for const oldOn = sock.ev.on; sock.ev.on = oldOn;
