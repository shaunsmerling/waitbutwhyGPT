import axios from 'axios'
import * as cheerio from 'cheerio'
import {encode} from 'gpt-3-encoder'
import {TUChunk, TUEssay, TUJSON} from "../types/index"
import fs from "fs"


const BASE_URL = "https://waitbutwhy.com/"
const CHUNK_SIZE = 200

const grabLinks = async () => {
    const html = await axios.get(`${BASE_URL}/archive`)
    const $ = cheerio.load(html.data)
    const lists = $(".tab-content")

    const linksArr: { url: string, title: string }[] = []


    
 
 

    lists.each((i, list) => {
        const findList = $(list).find("a")
           findList.each((i, link) => {
            const url = $(link).attr("href")
            const title = $(link).text().trim()


            if (url && !url.endsWith("#comments") && title !== "") {
                const linkObj = {
                    url, 
                    title
                }

                linksArr.push(linkObj)

            }
           })
        })
    
return linksArr

}

const grabLinksAndData = async () => {
    const linksArr = await grabLinks()
  


        const html = await axios.get(linksArr[0].url)
        const $ = cheerio.load(html.data)
        const articleData = $("article").html()
        console.log(`Title: ${linksArr[0].title}`)
        console.log(`Article data: ${articleData}`)
    }


const getEssay = async (url: string, title: string) => {


    let essay: TUEssay = {
        title: "",
        url: "",
        date: "",
        content: "",
        tokens: 0,
        chunks: [],

    }

    const html = await axios.get(url)
    const $ = cheerio.load(html.data)
    const articles = $("article")


    articles.each((i, article) => {
        const content = $(article).find(".entry-content-wrap").text().trim()
        const dateStr = $(article).find(".date").text().trim()

        let cleanContent = content.replace( /\n/g, " ").replace(/\s\s+/g, " ").trim()

        const essayText = cleanContent



        essay = {
            title,
            url: url,
            date: dateStr,
            content: essayText,
            tokens: encode(essayText).length,
            chunks: []

        }

    })


    return essay 




}



const getChunks = async (essay: TUEssay) => {

    const {title, url, date, content} = essay;

    let essayTextChunks: string[] = []

    if(encode(content).length > CHUNK_SIZE) {
        const split = content.split(". ")
        let chunkText = ""


        for (let i = 0; i < split.length; i++) {
            const sentence = split[i]
            if (encode(chunkText + sentence).length > CHUNK_SIZE) {
                essayTextChunks.push(chunkText)
                chunkText = ""
            } 

            if(sentence && sentence[sentence.length - 1].match(/[a-z0-9]/i)) {
                chunkText += sentence + ". "
            } else {
                chunkText += sentence + " ";
            }
        }




        essayTextChunks.push(chunkText.trim())
    } else {
        essayTextChunks.push(content.trim())
    }
 

    const essayChunks: TUChunk[] = essayTextChunks.map((chunks) => {

        const chunk: TUChunk = {
            essay_title: title,
            essay_url: url,
            essay_date: date,
            content: chunks,
            content_tokens: encode(chunks).length,
            embedding: []

        }

        return chunk


    })

    if (essayChunks.length > 1) {
        for (let i = 0; i < essayChunks.length; i++) {
            const chunk = essayChunks[i]
            const prevChunk = essayChunks[i - 1]

            if (chunk.content_tokens < 100 && prevChunk) {
                prevChunk.content += " " + chunk.content
                prevChunk.content_tokens = encode(prevChunk.content).length
                essayChunks.splice(i, 1)
            }
        }
    }



    const chunkedEssay: TUEssay = {
        ...essay,
        chunks: essayChunks
    }

    return chunkedEssay
    

}

 (async () => {
   const links =  await grabLinks()

   let essays: TUEssay[] = []


   for (let i = 0; i < links.length; i++) {
       const essay = await getEssay(links[i].url, links[i].title)
       const chunkedEssay = await getChunks(essay)
       essays.push(chunkedEssay)
        }
   


   const json: TUJSON = {
    tokens: essays.reduce((acc, essay) => acc + essay.tokens, 0),
    essays
 };

 fs.writeFileSync("scripts/tu.json", JSON.stringify(json))


})()

