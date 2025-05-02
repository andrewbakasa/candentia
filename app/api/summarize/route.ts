import { NextApiRequest, NextApiResponse } from 'next';
import { Groq } from 'groq-sdk';
import { NextResponse } from "next/server";

// Adjust this value based on your Groq Cloud plan's limits
const MAX_CHUNK_SIZE = 4000; // Number of tokens per Groq request

export async function POST( request: Request ) {
                      
  const body = await request.json();
  const { text } = body;
  console.log("Total text Len =======>" ,text.length);
  if (!text) {
    return new NextResponse('Missing text content', { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GROQ_CLOUD_API_KEY;
  try {
    const groqCloudClient = new Groq({ apiKey });
    let summary = '';

    const chunks: string[] = splitTextWithMerging(text, 5500);
    console.log("Total chuncks=======>" ,chunks.length);
    let counter_ =0
    for (const chunk of chunks) {
      counter_++;
      if (counter_ > 30) {
        console.log('Reached limit of 30 chunks, exiting loop...');
        break;
      }
      console.log(`chunks ${counter_}:::::>>>>>>`, chunk.length)
      const response = await groqCloudClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Choose a suitable model
        messages: [
          { role: 'user', content: `Get topics from the following text:\n\n${chunk}` },
        ],
        temperature: 0.7, // Adjust for creativity (0 = factual, 1 = more creative)
        max_tokens: 2048, // Adjust based on your needs (maximum summary length)
        top_p: 1, // Adjust for favoring higher probability sequences
        frequency_penalty: 0, // Adjust for penalizing repetitive sequences
        presence_penalty: 0, // Adjust for penalizing overly present words
      });
      summary += response.choices[0]?.message?.content || '';
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Groq Error:', error);
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}

function splitTextWithMerging(text: string, maxLength: number = 6000): string[] {
  // Initial split using regular expression
  const regex = new RegExp(`.{1,${maxLength}}`, 'g');
  const initialChunks: string[] = text.match(regex) || []; 

  // Merge chunks while staying under maxLength
  const mergedChunks: string[] = [];
  let currentChunk: string = "";
  for (const chunk of initialChunks) {
      if (currentChunk.length + chunk.length <= maxLength) {
        currentChunk += " " + chunk; 
      } else {
        // push and empty
        mergedChunks.push(currentChunk.trim());
        //prepare to start next
        currentChunk = chunk;
      }
  }
  if (currentChunk) {
    mergedChunks.push(currentChunk.trim());
  }

  return mergedChunks;
}






// /* 
// Certainly, let's break down the provided code:

// **1. Imports:**

// - `import { NextApiRequest, NextApiResponse } from 'next';`: Imports necessary types for handling HTTP requests and responses within a Next.js environment.
// - `import { Groq } from 'groq-sdk';`: Imports the `Groq` class from the `groq-sdk` library, which is used to interact with the Groq API for generating text completions.
// - `import { NextResponse } from "next/server";`: Imports `NextResponse` for creating custom HTTP responses within Next.js.

// **2. Edge Runtime Configuration:**

// - `export const config = { runtime: 'edge' };`: Configures the API route to run on the Next.js Edge Runtime, which provides optimized performance for serverless functions.

// **3. POST Request Handler:**

// - `export async function POST(request: Request)`: Defines an asynchronous function that handles POST requests to this API route.

// **4. Form Data Handling:**

// - `const formData = await request.formData();`: Retrieves the form data from the incoming request.
// - `const text = formData.get('text')?.toString() || '';`: Extracts the text value from the form data, handling potential `null` or `undefined` values.

// **5. Input Validation:**

// - `if (!text) { ... }`: Checks if the `text` is empty. If empty, returns a 400 Bad Request response.

// **6. API Key Retrieval:**

// - `const apiKey = process.env.NEXT_PUBLIC_GROQ_CLOUD_API_KEY;`: Retrieves the Groq Cloud API key from the environment variables.

// **7. Groq Client Initialization:**

// - `const groqCloudClient = new Groq({ apiKey });`: Creates a new instance of the Groq client using the obtained API key.

// **8. Text Chunking:**

// - `const chunks = text.match(/(.{1,4000})/g) || [];`: Splits the input text into smaller chunks of up to 4000 characters using a regular expression. 
//This is crucial for handling long texts as Groq might have limitations on the maximum input size per request.

// **9. Iterative Processing:**

// - `for (const chunk of chunks) { ... }`: Iterates through each chunk of the text.
//     - Inside the loop:
//         - Constructs a Groq request with the current chunk, specifying the LLM model (`llama-3.3-70b-versatile`), desired temperature, and other parameters.
//         - Sends the request to the Groq API using `groqCloudClient.chat.completions.create()`.
//         - Retrieves the generated summary from the response.
//         - Appends the summary of the current chunk to the `summary` variable.

// **10. Response Handling:**

// - `return NextResponse.json({ summary });`: Returns a JSON response containing the accumulated summary from all processed chunks.

// **11. Error Handling:**

// - `catch (error) { ... }`: Catches any errors that might occur during the process, logs them to the console, and returns a 500 Internal Server Error response.

// **In Summary:**

// This code effectively handles the summarization of potentially long text inputs by:

// - Retrieving the input text from the request.
// - Splitting the text into smaller chunks.
// - Iteratively sending requests to the Groq API for each chunk.
// - Accumulating the summaries from each chunk.
// - Returning the final combined summary as a JSON response.

// By breaking down the input text into smaller chunks, 
// the code overcomes potential limitations related to input size and ensures more reliable and efficient summarization for larger texts.


//  */
