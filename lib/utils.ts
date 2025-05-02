import { SafeBoard, SafeCard, SafeCardWithBoard } from "@/app/types";
import { CardWithList2, ListWithCards, ListWithCards2, SafeBoard2, SafeCardWithList2, SafeListWithCards3 } from "@/types";
import { Card } from "@prisma/client";
import { type ClassValue, clsx } from "clsx"
import { differenceInDays } from "date-fns";
import { AlarmClock } from "lucide-react";
import moment from "moment";
import { List } from "postcss/lib/list";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// import { type ClassValue, clsx } from "clsx"
// import { twMerge } from "tailwind-merge"

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
};

export const getFactors =(x:number):number[]=>{
  let factors :number[]=[];
  for (let i = 1; i < Math.floor(x/2)+1; i++) {
    if (x%i==0){// no remainder
      factors.push(x/i)
    }
  }
  factors.push(1)  
  // console.log(`Factors of ${x} : ${factors}`)
  return factors
}
 export const findClosestFactor = (input:number,
                                  factorsOf100:number[]=[1, 2, 4, 5, 10, 20, 25, 50, 100] 
                                  ):number => {
    //descending....
    if (factorsOf100.length==0){
     return 1;
    }
    //sort descending...
    factorsOf100.sort((a,b)=>b-a);
    let closest =factorsOf100[0] ;
    //  getFactors(100)
    //  getFactors(21)
    //  getFactors(30)
  
    for (let factor of factorsOf100) {
      // 100
      // 100, 50
      //100, 50,25,20
      if (factor >= input && factor < closest) {
        //100>=100 && 100<100
        //100>=50 && 100<100; 50>=50 && 50<100
        //100>=16.6 && 100<100; 50>=16.6 && 50<100, 25>=16.6 && 25< 50,... 20>=16.6 && 20<
      
        closest = factor;
        //closest==50
      }
      if (factor<=input){
        //100>==100
        //100>==50,50>=50
        //20>=16.66
        // no need to continue answe fount already
        return closest;
      }
    }
    // setClosestFactor(closest);
    return closest
  };

export const getCardsFromSafeBoard0 = (data: SafeBoard2): SafeCardWithList2[] => {
  // Combine all cards from all lists into a single array
  let allCards: SafeCardWithList2[] = [];
  data.lists.forEach((list) => allCards.push(...list.cards));
  
 allCards?.sort((a, b) => 
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                       );
                 
  return allCards;  
};
export const getCardsFromSafeBoard2 = (data: SafeBoard2): SafeCardWithList2[] => {
  // Combine all cards from all lists into a single array
  let allCards: SafeCardWithList2[] = [];
  data.lists.forEach((list) => allCards.push(...list.cards));

  // Sort cards by updatedAt in descending order (newest to oldest)
  allCards.sort((a, b) => {
    const dateA = new Date(a.updatedAt);
    const dateB = new Date(b.updatedAt);
    return (dateB.getTime() - dateA.getTime()); // Descending order
  });

  // Optional: Sort by createdAt as well for a layered sorting (optional)
  allCards.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);

    // If updatedAt values are the same, sort by createdAt in descending order
    if (dateA.getTime() === dateB.getTime()) {
      return dateB.getTime() - dateA.getTime(); // Descending order
    }
    return 0; // No further sorting needed if updatedAt differs
  });
//  console.log('xxx---.',allCards)
  return allCards;
};

export const getCardsFromSafeBoard = (data: SafeBoard2): SafeCardWithList2[] => {
  //60 minutes...
  // Combine all cards from all lists into a single array
  let allCards: SafeCardWithList2[] = [];
  data.lists.forEach((list) => allCards.push(...list.cards));

  // Sort cards by updatedAt in descending order (newest to oldest)
  allCards.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Sort by createdAt within a one-minute window of updatedAt
  allCards.sort((a, b) => {
    const updatedAtDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (Math.abs(updatedAtDiff) <= 1000*60*60*24) {  // Check for 60minute one-minute difference*24hours
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Descending order
    }
    return updatedAtDiff;  // Maintain original updatedAt sort
  });

  return allCards;
};

export const getCardsFromSafeBoardOneday = (data: SafeBoard2): SafeCardWithList2[] => {
  //within one day
  // Combine all cards from all lists into a single array
  let allCards: SafeCardWithList2[] = [];
  data.lists.forEach((list) => allCards.push(...list.cards));

  // Single sort with custom comparison logic
  allCards.sort((a, b) => {
    const dateA = new Date(a.updatedAt);
    const dateB = new Date(b.updatedAt);

    // Sort by updatedAt in descending order (newest to oldest)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime(); // Descending order
    }

    // If updatedAt is the same day, sort by createdAt in descending order
    const dateAStart = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
    const dateBStart = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
    return dateBStart.getTime() - dateAStart.getTime(); // Descending order
  });

  return allCards;
};

// export const getCardsFromLists = (data: ListWithCards[], asc:Boolean=true): CardWithList2[] => {
export const getCardsFromLists = (data: ListWithCards2[], asc:Boolean=true): CardWithList2[] => {
  // Combine all cards from all lists into a single array
  let allCards: CardWithList2[] = [];
  data.forEach((list) => allCards.push(...list.cards));
  allCards.sort((a,b)=>{ 
     let a_date= new Date(a.updatedAt)  
     let b_date= new Date(b.updatedAt)  
     if (asc==true){
      //start with oldest
      return(a_date.getTime() - b_date.getTime())
  
     }
    return(b_date.getTime() - a_date.getTime())
  })
  return allCards;
};
 export const getOrderedListWithCards=(data:ListWithCards2[])=>{
  const newData=[...data]
  let orderedData = newData?.map((list)=>({
    ...list,
     cards: list.cards?.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }))

  orderedData = newData?.map((list)=>({
     ...list,
     cards: list.cards?.sort((a, b) => {
                          const updatedAtDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                          if (Math.abs(updatedAtDiff) <= 1000*60*60*24) {  // Check for 60minute one-minute difference*24hours
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Descending order
                          }
                          return updatedAtDiff;  // Maintain original updatedAt sort
                        })
  }))

  return orderedData
}
   

export const getLatestCard = (cards: SafeCardWithList2[]):SafeCardWithList2  => {
  // Sort cards by updatedAt in descending order
  // changedlogic
  let cardsCopy = [...cards];

  let sortedCards = cardsCopy?.sort((a, b) => 
                                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                               );
  
  return sortedCards[0];
};
export const getLatestCard2 = (cards: SafeCard[]): SafeCard  => {
  // Sort cards by updatedAt in descending order
  let cardsCopy = [...cards];

  const sortedCards = cardsCopy?.sort((a, b) => 
                                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                               );
  
  return sortedCards[0];
};

export  function sortDates (data:SafeBoard2[]){
  //sord board by updatedAt in descending order
  //project with latest insert or update(changes) becomes top on theeck...
  let dataCopy = [...data];

  dataCopy?.sort(
      (a,b) =>{
             //----------cover for cases there are empty card in all lists of a board----------------
            const a_cards=getCardsFromSafeBoard(a);
            let a_date= new Date(a.updatedAt)  
            if (a_cards.length!==0){
               a_date= new Date(getLatestCard(a_cards).updatedAt) 
            }
            const b_cards=getCardsFromSafeBoard(b);
            let b_date= new Date(b.updatedAt)  
            if (b_cards.length!==0){
               b_date= new Date(getLatestCard(b_cards).updatedAt) 
            }
            //  ------------------------------------------------------------------------------------
             return (b_date.getTime() - a_date.getTime())
           }
      ); // Sort by ascending date
  return dataCopy;
  
 }



export function checkStringFromStringArray(yourBigString:string, substringsArray:string[]){
  //console.log(yourBigString, typeof(yourBigString), substringsArray)
  if (yourBigString ===null) {
     return false
  }
   const val =substringsArray.some(substring => yourBigString.toLowerCase().includes(substring.toLowerCase()));
   //console.log(val)
   return  val
}

export function getColorFromPercent(val:number){
  if ( val <= 10) {
    return "#ffc100" ;
  } else if (val <= 25) {
    return "#ff9a00" ;
  } else if (val <= 50) {
    return "#ff7400" ;
  } else if (val <= 75) {
    return "#ff4d00" ;  
  } else {
    return "#ff0000" ;
  }
 
}
export function isNumber(obj: unknown): obj is number {
  return typeof obj === 'number';
}

export function  getTextAreaRow(val:number){
 
  let x:number= Math.floor(val/30) + 1
  //console.log("text:", val, "rows:", x,)
  //clamp 2---10
  return Math.max(2,Math.min(x,10))
  
}

export function getTextAreaHeight(val:number){
  //return only two heights 120:180
  //30 words per line
  //120px = 4lines (each line is 30px)

  // a
  let x:number= Math.floor(val/30)*30 + 30 
  //console.log("text-len: Formulae:", val,x)

  if (val < 100){
    return 100
  }else {
    return 180
  }
}
export function areDatesSimilar(date1:string, date2:string, maxDiffInDays:number) {
  // Convert dates to Moment objects if necessary
  const momentDate1 = moment(date1);
  const momentDate2 = moment(date2);

  const diffInDays = momentDate2.diff(momentDate1, 'days');
  return Math.abs(diffInDays) <= maxDiffInDays;
}
export function getDateTodayYesterdayORFormatedDate(inputX:string){
  const today = new Date();             
  const dateA = new Date(inputX);
  const returnDate =moment(dateA).format('MMMM Do, YYYY')
  const daysLeft =  differenceInDays(dateA, today)
  if (Math.abs(daysLeft) <  2)  {
    if (Math.abs(daysLeft) ==  0){
     return ' Today'
    }else{
      return ' Yesterday'
    }
  }else {
    return returnDate
  }
 
}

export function isJsonStringEditorCompatible(str:any|null|undefined) {
     
  try {
      JSON.parse(str);
      const xx =JSON.parse(str)
      //console.log('Checking: xx.blocks',xx)
      if ( 'blocks' in xx || 'blockMap' in xx ){
          //console.log("No blocks: what is in side :" ,xx)
         return true
      }
      //console.log('Satisfied')
  } catch (e) {
      //console.log('Error', e.error, str)
      return false;
  }
  return true;
}

export function getGreatThanZeroOrEmptyStr(val:number,output:string){
  if (val>0){
   return output;
  }
  return ''
 }
 export function getTotal(data:ListWithCards2[]){
   let listCount=0 ;
   let cardCount=0;
   let completed=0;
   let wip=0;
   let untagged=0
   let stabbled =0
 
   data?.map(list =>{ 
     // if the is is visible show it
     // already filter
      listCount=listCount +1; 
      cardCount=cardCount + list.cards.length
      list.cards?.map((x)=>{
       if (x?.progress=='complete'){
         completed=completed+1;
       }else if(x?.progress=='wip'){
         wip=wip+1;
       }else if(x?.progress=='stabbled'){
         stabbled=stabbled+1
       }else{
         untagged=untagged+1
       }
      });
   });
   return{listCount,cardCount,completed,wip,untagged,stabbled}
 }
 export function  getProgressStatus(b:any){
   const completedStr= getGreatThanZeroOrEmptyStr(b.completed,`, comp=${b.completed}(${Math.round(b.completed*100/b.cardCount)}%)`)  
   const wipStr= getGreatThanZeroOrEmptyStr(b.wip,`, wip=${b.wip}`)  
   const untaggedStr= getGreatThanZeroOrEmptyStr(b.untagged,`, utg=${b.untagged}`)  
   const stabbledStr= getGreatThanZeroOrEmptyStr(b.stabbled,`, sta=${b.stabbled}`)  
   return `total=${b.cardCount} ${completedStr} ${wipStr} ${untaggedStr} ${stabbledStr}`
 }

 export function compareStringArrays(array1:string[], array2 :string[]) {
  // Check if lengths are different
  if (array1.length !== array2.length) {
    return false;
  }

  // Sort both arrays
  array1.sort();
  array2.sort();

  // Compare elements
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }

  return true;
}

type LabeledValue = { value: string; label: string };

// // Sample arrays (replace with your actual data)
// const labeledArray: LabeledValue[] = [
//   { value: 'apple', label: 'Apple' },
//   { value: 'banana', label: 'Banana' },
//   { value: 'orange', label: 'Orange' },
// ];

// const valuesOnlyArray: string[] = ['banana', 'grape', 'apple'];

// Function to get labels from values efficiently using Set and Map
export function getLabelsFromValues(labeledArray: LabeledValue[], valuesOnlyArray: string[]): string[] {
  // Create a Set to efficiently check for value existence in labeledArray
  const valueSet = new Set(labeledArray.map(item => item.value));

  // Create a Map for faster label lookup by value
  const labelMap = new Map(labeledArray.map(item => [item.value, item.label]));

  return valuesOnlyArray.filter(value => valueSet.has(value))
                        .map(value => labelMap.get(value)!) // Use non-null assertion for certainty
}

export function getValuesFromLabels(labeledArray: LabeledValue[], labelsOnlyArray: string[]): string[] {
  // Create a Set to efficiently check for label existence in labeledArray
  const labelSet = new Set(labeledArray.map(item => item.label));

  // Create a Map for faster value lookup by label
  const valueMap = new Map(labeledArray.map(item => [item.label, item.value]));

  return labelsOnlyArray.filter(label => labelSet.has(label))
    .map(label => valueMap.get(label)!); // Use non-null assertion for certainty
}
export function getLabelsAndValuesFromValues(
  labelValueArray: LabeledValue[],
  valueArray: string[]
): LabeledValue[] {
  return valueArray?.map((value) =>
    labelValueArray?.find((obj) => obj.value === value) || { value, label: '' }
  );
}
export function getLabelsAndValuesFromValues2(
  labelValueArray: LabeledValue[],
  valueArray: ValueLabelObject2[]
): LabeledValue[] {
  return valueArray?.map((value) =>
    labelValueArray?.find((obj) => obj.value ===value.userId) || { value:value.userId, label: '' }
  );
}

interface ValueLabelObject {
  value:  string;
  label: string;
}
interface ValueLabelObject2 {
  id: string;
  cardId: string;
  userId:string;
}

export function findLabelByValue(data: ValueLabelObject[], searchValue: number | string): string | undefined {
  const foundObject = data.find(item => item.value === searchValue);
  return foundObject ? foundObject.label : undefined;
}

// Assuming you have functions for truncation and formatting
export function truncateString(text: string, maxLength: number): string {
  // Implement your truncation logic here
  return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
}

export function NumberFormatter(value: number): string {
  // Implement your formatting logic here (e.g., comma separators, decimals)
  return value.toFixed(2); // Example formatting to two decimal places
}
// // Example usage:
// const data: ValueLabelObject[] = [
//   { value: 1, label: 'One' },
//   { value: 2, label: 'Two' },
//   { value: 3, label: 'Three' }
// ];

// const searchValue = 2;
// const label = findLabelByValue(data, searchValue);

// console.log(label); // Output: 'Two'

export function isWithinOneDay(date1: string, date2: string | moment.Moment): boolean {
  const momentDate1 = moment(date1);
  const momentDate2 = moment(date2);

  // Calculate the difference in days
  const daysDifference = momentDate2.diff(momentDate1, 'days');

  // Check if the difference is within one day
  return daysDifference <= 1;
}




export function isJsonString(str:string) {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}
