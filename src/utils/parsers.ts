import {APIDashboard, ArgoClient} from 'argoscuola.js'
import { Client } from 'whatsapp-web.js'

export function parseCompiti(compiti: APIDashboard["dati"]["0"]["registro"], client: Client) {
    let compitiParsati: Record<string, Compito[]> = {}

    for (let compito of compiti) {
        if (compito.compiti.length == 0) continue
        
        if (toUnix(compito.compiti[0].dataConsegna) >= toUnix(toYMD(Date.now()).postDate)) {
            const materiaParsata = compito.materia.split(' ').map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ')

            if (!compitiParsati[materiaParsata]) compitiParsati[materiaParsata] = []

            if (compito.compiti.length) {
                compitiParsati[materiaParsata].push({
                    compito: compito.compiti[0].compito,
                    data: formatDate(client.argoConfig.argo.formatoData.toLowerCase(), compito.compiti[0].dataConsegna)!,
                    materia: compito.materia
                })
            }
        }
    }
    return compitiParsati
}

export function compitiToString(compiti: Record<string, Compito[]>) { 
    let str = ""
    for (let materia in compiti) {
        str += `\n\nCompiti di ${materia}:`
        for (let compito of compiti[materia]) {
            str += `\n- ${compito.compito.trim()} | Scadenza: ${compito.data}`
        }
    }

    return str.slice(2)
}

interface Compito {
    materia: string,
    compito: string,
    data: string,
}

function toUnix(date: string) {
    const d = new Date(date)
    return Math.floor(d.getTime() / 1000)
}

function toYMD(dataD: number) {
    let data = new Date(dataD)
    const locale = data.toLocaleString('en-ZA', { timeZone: 'Europe/Rome' })
    let month: number | string = data.getMonth() + 1
    let day: string | number = data.getDate()
    let year = data.getFullYear()
    if (day <= 9)
        day = '0' + day
    if (month < 10)
        month = '0' + month
    const postDate = year + '-' + month + '-' + day
    const time = locale.split(',')[1].split(' ')[1]
    return { postDate, time }
}

function formatDate(type: string, date: string) {
    const d = new Date(date)
    let month: number | string = d.getMonth() + 1
    let day: string | number = d.getDate()
    let year = d.getFullYear()
    if (day <= 9)
        day = '0' + day
    if (month < 10)
        month = '0' + month
    if (type == "yyyymmdd")
        return year + '-' + month + '-' + day
    else if (type == "ddmmyyyy")
        return day + '-' + month + '-' + year
    
    return date
}