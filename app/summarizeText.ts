

// summarize.ts
export const handleSummarize = async (text: string): Promise<string> => {
  try {
     // Limit the text to 6000 characters
    const limitedText = text;//text.substring(0, 5900); 

    const response = await fetch('/api/summarize/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text:limitedText }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    console.log("summarized ::::::::   ===>:", data.summary);
    return data.summary;

  } catch (error: any) {
    console.error('Error summarizing text:', error.toString());
    return '';
  }
};

// export const handleSummarize = async (text: string): Promise<string> => {
//   try {
//      // Limit the text to 6000 characters
//     const limitedText = text;//text.substring(0, 5900);
//     const formData = new FormData();
//     formData.append('text', text); 

//     const response = await fetch('/api/summarize/', {
//       method: 'POST',
//       body: formData,
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log("summarized ::::::::   ===>:", data.summary);
//     return data.summary;

//   } catch (error: any) {
//     console.error('Error summarizing text:', error.toString());
//     return '';
//   }
// };