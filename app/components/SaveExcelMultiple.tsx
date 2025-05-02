'use client';
import { useState, useEffect} from 'react'
import Excel from 'exceljs';
import { saveAs } from 'file-saver';
import { SafeBoard } from "@/app/types";
import {FaFileExcel} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import Moment from 'moment'
import { toast } from "sonner";
import moment from 'moment';
import { getTextFromEditorSafe } from '@/components/modals/card-modal/description';
interface DownloadProps {
  data: SafeBoard[];
  fileName:string,
  disabled:boolean
}


const SaveExcelMutliple: React.FC<DownloadProps> =  ({
disabled,   
data,
fileName

    }) => {

        
        const [excelDownLoad, setexcelDownLoad] = useState(false);
        //const [filteredBoards, setFilteredBoards] = useState(data);
        const sortArrayByDate = (data: SafeBoard[]): SafeBoard[] => {
            return data.slice().sort((a, b) => {
              // Parse strings into Date objects for accurate comparison
              const dateA = new Date(a.updatedAt);
              const dateB = new Date(b.updatedAt);
          
              // Ensure valid dates (optional, but good practice)
              if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                console.warn('Invalid date format in updatedAt field');
                return 0; // Return 0 to maintain original order in case of errors
              }
          
              // Sort in descending order (most recent updates first)
              return dateB.getTime() - dateA.getTime();
            });
          };

        const columns2 = [
                        {
                            key: 'board_title',
                            header: 'Board Title'
                        },
                        {
                            key: 'list_title',
                            header: 'Category Title'
                        },
                        {
                        key: 'card_title',
                        header: 'Activity Title'
                        },
                        {
                        key: 'card_description',
                        header: 'Activity Description'
                        },
                        {
                            key: 'card_created',
                            header: 'Created'
                        },
                        {
                            key: 'card_updated',
                            header: 'Updated'
                        }   
                    ]
        const workbook = new Excel.Workbook();
    
        let workSheetName = 'Wksheet_search';
      
       let boardListFilterCard: SafeBoard[]=data
       let sortedBoardListFilterCard=sortArrayByDate(boardListFilterCard);
        const save  = async () => {    
            try {
                    setexcelDownLoad(true);
                    let newDate = new Date();
                    const _date= Moment(newDate).format('YYYY_MMMM_DD-HHmmss') ;

                    let fileName2 =fileName + _date;
                    // creating one worksheet in workbook
                    const worksheet = workbook.addWorksheet(workSheetName);
                
                    // add worksheet columns
                    // each columns contains header and its mapping key from data
                    worksheet.columns = columns2;
                
                    // updated the font for first row.
                    worksheet.getRow(1).font = { bold: true };
                
                    // loop through all of the columns and set the alignment with width.
                    worksheet.columns.forEach(column => {
                        // console.log('>>>>>>>>>>>>>>>>>>', column, typeof(column))
                        // worksheet.addRow(['Nothing...'])
                        // worksheet.addRow([column,column,typeof(column)]);

                        if (column?.key){
                            if (['card_description'].includes(column?.key)){
                            
                            column.width = 20 + 85;
                            column.alignment = { horizontal: 'left' };
                            }else  if (['card_title', 'card_title'].includes(column.key)){
                                column.width = 20 +40;
                                column.alignment = { horizontal: 'left' };
                        
                            }else  if (['_id'].includes(column.key)){
                                //console.log('found',column.key)
                                column.width = 20 + 5 +25;
                                column.alignment = { horizontal: 'left' };
                    
                            }else  if (['price'].includes(column.key)){
                            column.width = 20 + 5 + 5;
                            column.alignment = { horizontal: 'right' };
                            }else  if (['countInStock', 'rating', 'numReviews'].includes(column.key)){
                            column.width = 20 + 5 ;
                            column.alignment = { horizontal: 'right' };
                        
                            }else {
                            column.width = 20 + 5;
                            column.alignment = { horizontal: 'left' };
                            } 
                        }
                    });
                
                    let board_title:string;
                    let list_title:string;
                    let card_title:string;
                    let card_description:string;
                    let card_created:string;
                    let card_updated:string;
                    sortedBoardListFilterCard.forEach((board)=>{
                        board_title = board.title;
                        board.lists.forEach((x)=>{
                            //each list...
                            
                            list_title = x.title;

                            //change cards
                            x.cards.forEach((card)=>{
                                card_title = card.title;
                                card_description =getTextFromEditorSafe(card).replace(/\n/g, " ")
                                card_created = moment(card.createdAt).format('MMMM Do, YYYY'); // Example: February 28th, 2024
                                card_updated = moment(card.updatedAt).format('MMMM Do, YYYY');                        
                            // 
                                const dateObj_createdAt = moment(card.createdAt);
                                const dateObj_updateAT = moment(card.updatedAt); // Two days difference
                                const tolerance = moment.duration(1, 'days'); // One day tolerance

                                if (dateObj_createdAt.diff(dateObj_updateAT, 'days', true) <= tolerance.asDays()) {
                                    //card_updated=""
                                    // console.log("Dates are similar (within 1 day tolerance)", card.createdAt,card.updatedAt);
                                } else {
                                    // console.log("Dates are not similar");
                                }

                                worksheet.addRow([board_title,list_title,card_title,card_description,card_created, card_updated]);
                            });
                            
                        });
                    });
                                       
                    worksheet.columns.forEach(column => {
                        column.border = {
                            top: { style: "thick" },
                            left: { style: "thick" },
                            bottom: { style: "thick" },
                            right: { style: "thick" }
                        };
                        });
                    worksheet.columns.forEach((col) => {

                        if (col?.style) {
                            col.style.font = { name: 'Comic Sans MS' };
                            col.style.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        }
                    })
                  
                    worksheet.addRow([""])
                   
                    // write the content using writeBuffer
                    const buf = await workbook.xlsx.writeBuffer();
                
                    // download the processed file
                    saveAs(new Blob([buf]), `${fileName2}.xlsx`);
                } catch (error) {
                    console.log('-------->>>',error,)
                    toast.error(`Error in Saving`);
                    
                } finally {
                    // removing worksheet's instance to create new one
                    workbook.removeWorksheet(workSheetName);
                    setexcelDownLoad(false)
                }
        };
  

        return ( 
        
                <Button
                    variant="ghost"
                    onClick={save}                                    
                    disabled={excelDownLoad || disabled}
                    className="rounded-none h-[41px] w-[41px] sm:mt-9  justify-start font-normal text-lg"
                >
                        <FaFileExcel size={40} />  
                </Button>
        )
    };
 
export default SaveExcelMutliple;