'use client';
import { useState, useEffect} from 'react'
import Excel from 'exceljs';
import { saveAs } from 'file-saver';
import {FaFileExcel} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import Moment from 'moment'
import { toast } from "sonner";
import moment from 'moment';
import {getTextFromEditorSafe } from '@/components/modals/card-modal/description';
import { ListWithCards } from '@/types';
import { SafeCard } from '../types';
interface DownloadProps {
  data: ListWithCards [];
  fileName:string,
  disabled:boolean
}



const SaveExcel: React.FC<DownloadProps> =  ({
disabled,   
data,
fileName

    }) => {

        const [excelDownLoad, setexcelDownLoad] = useState(false);
        const columns2 = [
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
    
        let workSheetName = 'Wksheet_summary';
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
                
                
                    let list_title:string;
                    let card_title:string;
                    let card_description:string;
                    let card_created:string;
                    let card_updated:string;
                    data.forEach((x)=>{
                        //each list...
                        
                        list_title = x.title;

                        //change cards
                        x.cards.forEach((x_card)=>{
                            const card:SafeCard = {
                                ...x_card,
                                createdAt:x_card.createdAt.toString(),
                                updatedAt:x_card.updatedAt.toString(),
                              }
                            
                        
                            if (card){
                            card_title = card.title;
                            card_description = getTextFromEditorSafe(card).replace(/\n/g, " ")
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

                            worksheet.addRow([list_title,card_title,card_description,card_created, card_updated]);
                            }
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
                className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
                >
                Download {" "} <FaFileExcel size={20} />  
                </Button>
        )
    };
 
export default SaveExcel;