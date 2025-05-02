import { createApi } from "unsplash-js";

const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!

//console.log("Unsplash Access Key:", accessKey); // Add this line

export const unsplash = createApi({
  accessKey: accessKey,
 // fetch: fetch,
});
