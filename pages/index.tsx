import Head from 'next/head'
import { Inter } from 'next/font/google'
import { useState } from 'react'
import { TUChunk } from '../types'
import endent from 'endent'
import { Answer } from '@/components/answer/Answer'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [chunks, setChunks] = useState<TUChunk[]>([])
  const [loading, setLoading] = useState(false)


  const handleAnswer = async () => {
    setLoading(true)
    const searchResponse = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
  })

  if (!searchResponse.ok) {
    setLoading(false)
    return;
  }

  const results: TUChunk[] = await searchResponse.json()
  setChunks(results)

  const prompt =  endent`
  Use the following passages to answer the query: ${query}

  ${results.map((chunk) => chunk.content).join('\n')}
  `


  

  const answerResponse = await fetch('/api/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  })

  if (!answerResponse.ok) {
    setLoading(false)
    return;

  }


  const data = answerResponse.body

  if (!data) {
    return
  }

  const reader = data.getReader();
  const decoder = new TextDecoder();
  let done = false;


  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value)
    setAnswer((prev) => prev + chunkValue);
    }

    setLoading(false)
  }


  const handleClear = () => {
    setQuery('')
    setAnswer('')

  }
  
  return (
    <>
  
    <Head>
      <title>Wait But Why GPT</title>
      <meta name="description" content="AI Q&A on Tim Urban's Essays" />
    </Head>

    <div className="relative flex flex-col items-center justify-center w-96 mt-10 mx-auto">
  
      <input placeholder="Ask Tim..." className="w-full px-4 py-2 mb-4 border-2 border-black rounded-full text-black" type="text" value={query} onChange={(e) => setQuery(e.target.value)}/>
      <div className="flex space-x-4">
        <button onClick={handleAnswer} className="relative z-10 px-4 py-2 text-xs text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline-blue">Submit</button>
        <button onClick={handleClear} className="relative z-10 px-4 py-2 text-xs text-white bg-red-500 rounded-full hover:bg-red-700 focus:outline-none focus:shadow-outline-red">Reset</button>
      </div>
      <div className="mt-10">
        {
          loading ? 
          <div>Loading...</div> :
          <Answer text={answer} />
        }
      </div>
    </div> 

    </>
  )
}
