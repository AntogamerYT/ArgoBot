import { Client, Message } from "whatsapp-web.js";
import { compitiToString, parseCompiti } from "../utils/parsers.js";


export const name = "compiti"
export async function execute(client: Client, message: Message, args: string[]) {
    await client.argo.argo.aggiornaData(new Date(Date.now()));
    const dashboard = await client.argo.argo.getDashboard();

    const compiti = parseCompiti(dashboard.dati[0].registro, client)

    const compitiString = compitiToString(compiti)

    if (compitiString.length > 0) {
        message.reply(compitiString)
    } else {
        message.reply("Non ci sono compiti!")
    }
}