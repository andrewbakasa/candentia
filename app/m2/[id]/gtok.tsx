// import { Groq, Chat } from 'groq-sdk';
// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//     try {
//         const body = await req.json();
//         const { text } = body;

//         if (!text) {
//             return new NextResponse('Missing text content', { status: 400 });
//         }

//         const groqCloudClient = new Groq({ apiKey: process.env.GROQ_API_KEY || 'YOUR_API_KEY' }); // Use environment variable

//         const chatCompletion = await groqCloudClient.chat.completions.create({
//             model: 'llama-3.3-70b-versatile', // Use the model from the second snippet
//             messages: [
//                 { role: 'user', content: text }, // Use the 'text' from the request body
//             ],
//             temperature: 0.7, // Use the temperature from the second snippet
//             max_tokens: 2048, // Use the max_tokens from the second snippet
//             top_p: 1,           // Use top_p from the second snippet
//             frequency_penalty: 0,
//             presence_penalty: 0,
//             stream: true,
//             stop: null
//         });

//         const stream = new ReadableStream({
//             async start(controller) {
//                 const encoder = new TextEncoder();
//                 try {
//                     for await (const chunk of chatCompletion) {
//                         const content = chunk.choices[0]?.delta?.content;
//                         if (content) {
//                             const encoded = encoder.encode(content);
//                             controller.enqueue(encoded);
//                         }
//                     }
//                     controller.close();
//                 } catch (error) {
//                     controller.error(error);
//                 }
//             }
//         });
//       // @ts-expect-error
//         return new NextResponse(stream);
//     } catch (error) {
//         console.error("Error during Groq chat completion:", error);
//         return NextResponse.json({ error: 'Failed to fetch response from Groq' }, { status: 500 });
//     }
// }
