import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import DebouncedInput from "./DebouncedInput";
import DownloadBtn from "./DownloadBtn";
import { SearchIcon } from "./Icons";

import type { ColumnDef } from '@tanstack/react-table';
import { useAction } from "@/hooks/use-action";
import { updatePagSize } from "@/actions/update-user-pagesize";
import { toast } from "sonner";

interface ReactTableProps<T extends object> {
 data: T[];
 columns: any// ColumnDef<T>[];
 userPageSize:number,
 currentUser:any
 setPageSize:(x:number)=>void,
}

export const TanStackTable = <T extends object>({ data, columns,userPageSize, currentUser, setPageSize }: ReactTableProps<T>) => {

  
const [globalFilter, setGlobalFilter] = useState("");
// const [pagination, setPagination] = useState({pageIndex:0, pageSize:Number(userPageSize)});
const { execute, fieldErrors } = useAction(updatePagSize, {
  onSuccess: (data) => {
    toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
  },
  onError: (error) => {
    toast.error(error);
  },
});
 const table = useReactTable({
   data,
   columns,
   state: {
        globalFilter,
        // pagination
      },
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // onPaginationChange:setPagination,
    initialState:{
      pagination:{pageIndex:0,pageSize:Number(userPageSize)}
    }
  });





  return (
    <div 
      className="px-2 mt-1  mx-auto text-black fill-gray-400"
    >
      <table className="border border-gray-700 w-full text-left">
        <thead className="bg-indigo-600">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="capitalize px-3.5 py-2">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table?.getRowModel()?.rows?.length ? (
            table?.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`
                ${i % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}
                `}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3.5 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="text-center h-32">
              <td colSpan={12}>No Recoard Found!</td>
            </tr>
          )}
        </tbody>
      </table>
      {/* pagination */}
      <div className="flex items-center justify-end mt-2 gap-2">
        <button
          onClick={() => {
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
          className="p-1 border text-gray-700 border-gray-300 px-2 disabled:opacity-30"
        >
          {"<"}
        </button>
        <button
          onClick={() => {
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
          className="p-1 border text-gray-700 border-gray-300 px-2 disabled:opacity-30"
        >
          {">"}
        </button>

        <span className="flex items-center gap-1 text-gray-700">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border text-gray-700 p-1 rounded w-16 bg-transparent"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
            setPageSize(Number(e.target.value));
            
            if (currentUser){
              execute({
                id: currentUser?.id,
                pageSize:Number(e.target.value)
              })
            }
          }}
          className="p-2 bg-gray-100 text-gray-700 "
        >
          {[1,2,3,4,8, 16,24, 32,48, 60].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TanStackTable;