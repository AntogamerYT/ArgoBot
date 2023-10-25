import { ArgoClient } from 'argoscuola.js';
import fs from 'fs'
import { destr } from 'destr'
import pkg, { Client, Message } from 'whatsapp-web.js'
const { LocalAuth } = pkg
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal'

const cwd = fileURLToPath(new URL('.', import.meta.url));



const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }
})

client.commands = new Map()

if (!fs.existsSync('config.json')) {
    throw new Error("Il file di configurazione non esiste! (config.json)")
}

client.argoConfig = destr<Config>(fs.readFileSync('config.json', 'utf-8'))

validateConfig(client.argoConfig)

client.argo = new ArgoClient({
    codScuola: client.argoConfig.argo.codiceScuola,
    username: client.argoConfig.argo.username,
    password: client.argoConfig.argo.password
})

await client.argo.login()
await client.argo.argo.selectUser(client.argoConfig.argo.nome, client.argoConfig.argo.cognome);

const commandsDir = fs.readdirSync(`${cwd}/commands`).filter(file => file.endsWith('.js'))

for (const file of commandsDir) {
    const command = await import(`file://${cwd}/commands/${file}`)
    client.commands.set(command.name, command)
}

client.on("qr", qr => {
    console.log("QR RICEVUTO!\n\nScannerizzalo su WhatsApp per accedere con l'account desiderato\n\n")
    qrcode.generate(qr, { small: true })
})

client.on("ready", () => {
    console.log("Bot online!")
})

client.on("message", async message => {
    if (message.body.startsWith(client.argoConfig.prefix)) {
        const args = message.body.slice(client.argoConfig.prefix.length).trim().split(/ +/);
        const command = args.shift()!.toLowerCase();

        if (!client.commands.has(command)) return;

        try {
            client.commands.get(command)!.execute(client, message, args);
        } catch (error) {
            console.error(error);
            message.reply("Si è verificato un errore durante l'esecuzione del comando!")
        }
    }
})

client.initialize();


function validateConfig(config: Config) {
    // modo di merda per farlo ma non ho idee decenti
    if (!config.prefix) throw new Error("Il prefisso non è stato impostato!")
    if (!config.argo) throw new Error("La configurazione di Argo non è stata impostata!")
    if (!config.argo.codiceScuola) throw new Error("Il codice scuola non è stato impostato!")
    if (!config.argo.username) throw new Error("Lo username non è stato impostato!")
    if (!config.argo.password) throw new Error("La password non è stata impostata!")
    if (!config.argo.nome) throw new Error("Il nome non è stato impostato!")
    if (!config.argo.cognome) throw new Error("Il cognome non è stato impostato!")
    if (!config.argo.formatoData) throw new Error("Il formato data non è stato impostato!")
    if (config.argo.formatoData.toLowerCase() != "yyyymmdd" && config.argo.formatoData.toLowerCase() != "ddmmyyyy") throw new Error("Il formato data non è valido!")
}



interface Config {
    prefix: string,
    argo: {
        codiceScuola: string,
        username: string,
        password: string,
        nome: string,
        cognome: string,
        formatoData: string
    }
}

declare module 'whatsapp-web.js' {
    interface Client {
        commands: Map<string, Command>
        argo: ArgoClient
        argoConfig: Config
    }
}

interface Command {
    name: string,
    execute: (client: Client, message: Message, args: string[]) => void
}